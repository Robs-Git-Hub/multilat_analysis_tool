# 1: Imports and Initial Data Setup
import pandas as pd
import numpy as np
import plotly.graph_objects as go

from dash import Dash, dcc, html
from dash.dependencies import Input, Output

# ──────────── 1. Raw data with Categories ────────────
data_raw = [
    {"ngram": "Disarmament",    "US": 400, "Russia": 380, "Middle": 420, "Category": "Category A"},
    {"ngram": "Climate Change", "US": 550, "Russia":  30, "Middle":  20, "Category": "Category B"},
    {"ngram": "Human Rights",   "US": 300, "Russia": 200, "Middle": 400, "Category": "Category A"},
    {"ngram": "Global Security", "US": 100, "Russia": 150, "Middle": 50, "Category": "Category B"},
    {"ngram": "Trade Policy",   "US": 250, "Russia": 50, "Middle": 150, "Category": "Category A"},
    {"ngram": "Peacekeeping",   "US": 200, "Russia": 180, "Middle": 220, "Category": "Category B"},
    {"ngram": "Development Aid", "US": 150, "Russia":  10, "Middle":  80, "Category": "Category A"},
]
df_original = pd.DataFrame(data_raw)

def process_data(input_df):
    df = input_df.copy()
    if 'Category' not in df.columns:
        df['Category'] = 'Uncategorized'

    for g in ["US", "Russia", "Middle"]:
        total = df[g].sum()
        if total > 0:
            df[f"r_{g}"] = df[g] / total
        else:
            df[f"r_{g}"] = 0
    df["r_sum"] = df[["r_US", "r_Russia", "r_Middle"]].sum(axis=1)
    # Calculate P_US, P_Russia, P_Middle based on their definitions
    df["P_US"]     = np.where(df["r_sum"] > 0, df["r_US"]     / df["r_sum"], 1/3)
    df["P_Russia"] = np.where(df["r_sum"] > 0, df["r_Russia"] / df["r_sum"], 1/3)
    df["P_Middle"] = np.where(df["r_sum"] > 0, df["r_Middle"] / df["r_sum"], 1/3)

    df["TotalMentions"] = df[["US", "Russia", "Middle"]].sum(axis=1)
    min_size, max_size = 10, 50
    power = 1.5
    df_calculable_size = df[df["TotalMentions"] > 0].copy()
    df_zero_mentions = df[df["TotalMentions"] <= 0].copy()

    if not df_calculable_size.empty:
        df_calculable_size["TotalMentions"] = pd.to_numeric(df_calculable_size["TotalMentions"], errors='coerce').fillna(0)
        log_tot = np.log(df_calculable_size["TotalMentions"].clip(lower=1))
        scaled = log_tot ** power
        if scaled.min() == scaled.max():
            scaled_norm = 0.5
        else:
            scaled_norm = (scaled - scaled.min()) / (scaled.max() - scaled.min())
        df_calculable_size["size_px"] = min_size + scaled_norm * (max_size - min_size)
    
    if not df_zero_mentions.empty:
        df_zero_mentions["size_px"] = min_size
        
    df = pd.concat([df_calculable_size, df_zero_mentions]).sort_index()
    if 'size_px' not in df.columns:
        df['size_px'] = min_size
    return df

df_processed_original = process_data(df_original)

global_color_min = df_processed_original['TotalMentions'].min()
global_color_max = df_processed_original['TotalMentions'].max()

unique_categories = df_processed_original['Category'].unique()
dropdown_options = [{'label': 'All Categories', 'value': 'All'}] + \
                   [{'label': category, 'value': category} for category in unique_categories]


# 2: Create and run the Dash app
app = Dash(__name__)

app.layout = html.Div([
    html.H1("Interactive N-gram Ternary Plot (Dash)"),
    html.Div([
        dcc.Input(
            id='search-ngram-input',
            type='text',
            placeholder='Search n-grams...',
            debounce=True,
            style={
                'width': '20%',
                'marginRight': '2%',
                'height': '38px',
                'padding': '6px 12px',
                'fontSize': '14px',
                'boxSizing': 'border-box'
            }
        ),
        dcc.Dropdown(
            id='category-dropdown',
            options=dropdown_options,
            value='All',
            clearable=False,
            style={
                'width': '40%',
                'height': '38px',
                'fontSize': '14px',
                'boxSizing': 'border-box',
                'verticalAlign': 'middle'
            }
        )
    ], style={'display': 'flex', 'marginBottom': '20px', 'alignItems': 'center'}),
    
    dcc.Graph(
        id='ngram-ternary-plot',
    )
])

@app.callback(
    Output('ngram-ternary-plot', 'figure'),
    [Input('search-ngram-input', 'value'),
     Input('category-dropdown', 'value')]
)
def update_ternary_figure(search_term, selected_category):
    df_to_plot = df_processed_original.copy()

    if selected_category and selected_category != 'All':
        df_to_plot = df_to_plot[df_to_plot['Category'] == selected_category]

    if search_term:
        search_term_lower = search_term.lower().strip()
        df_to_plot['ngram'] = df_to_plot['ngram'].astype(str)
        df_to_plot = df_to_plot[df_to_plot['ngram'].str.lower().str.contains(search_term_lower)]

    fig = go.Figure()

    if df_to_plot.empty:
        fig.add_trace(go.Scatterternary(
            a=[1/3], b=[1/3], c=[1/3], # Placeholder values for axes
            mode="text", text=["No n-grams found for current filters."]
        ))
    else:
        fig.add_trace(go.Scatterternary(
            # Corrected arrangement with anticlockwise labeling:
            # a (top) will now be Middle
            # b (bottom-left) will now be Russia
            # c (bottom-right) will now be US
            a=df_to_plot['P_Middle'],   # Middle moved to top
            b=df_to_plot['P_Russia'],   # Russia moved to bottom-left
            c=df_to_plot['P_US'],       # US moved to bottom-right
            mode='markers',
            marker=dict(
                size=df_to_plot['size_px'],
                color=df_to_plot['TotalMentions'],
                colorscale=["#ffba00", "#6d6559"],
                cmin=global_color_min,
                cmax=global_color_max,
                colorbar=dict(
                    title="Total mentions",
                    thickness=20,
                    len=0.6,
                )
            ),
            text=df_to_plot['ngram'] + "<br>Category: " + df_to_plot['Category'],
            customdata=df_to_plot[['P_US', 'P_Russia', 'P_Middle', 'TotalMentions', 'size_px', 'Category']],
            hovertemplate=(
                "<b>Ngram:</b> %{text}<br>" + 
                "P_US (Original): %{customdata[0]:.3f}<br>" +
                "P_Russia (Original): %{customdata[1]:.3f}<br>" +
                "P_Middle (Original): %{customdata[2]:.3f}<br>" +
                "TotalMentions: %{customdata[3]}<br>" +
                "Size_px: %{customdata[4]:.1f}" +
                "<extra></extra>"
            )
        ))

    fig.update_layout(
        title="Relative Importance of n-grams by Voting Camp",
        margin=dict(l=80, r=80, t=80, b=60),
        ternary=dict(
            sum=1,
            # Corrected axis titles for anticlockwise labeling
            aaxis_title="Middle-ground emphasis",       # Middle now at top
            baxis_title="Russia-like voting emphasis",  # Russia now at bottom-left
            caxis_title="US-like voting emphasis",      # US now at bottom-right
            bgcolor="#f7f7f7"
        ),
        height=750,
        width=900 
    )
    return fig

if __name__ == '__main__':
    my_port = 8052
    print("Starting Dash app...")
    print(f"If running in Docker, try accessing the app at: http://localhost:{my_port} or http://127.0.0.1:{my_port}")
    print("Press interrupt (stop button in Jupyter) to stop.")
    try:
        app.run(
            jupyter_mode="external", # This should provide a clickable 127.0.0.1 link
            debug=True,
            port=my_port,
            host="0.0.0.0"
        )
    except KeyboardInterrupt:
        print("Dash app server stopped by user (KeyboardInterrupt).")
    except Exception as e:
        print(f"An error occurred: {e}")
    finally:
        print("Dash app cell execution finished.")