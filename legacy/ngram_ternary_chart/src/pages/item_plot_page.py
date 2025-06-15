# ngram_ternary_chart/src/pages/item_plot_page.py

import pandas as pd
import numpy as np
import logging
from dash import dcc, html
from dash.dependencies import Input, Output

# Utility functions for this page
from src.utils.ternary_data_utils import recalculate_bubble_sizes, create_plotly_ternary_figure

logger = logging.getLogger(__name__)

# --- Prefix for component IDs on this page to ensure uniqueness ---
PAGE_PREFIX = "item-plot"

def layout(
    df_with_base_attributes, # Renamed: Receives data with P_X, TotalMentions from app.py
    current_data_config,
    page_specific_configs, # Contains axis_mapping, TERNARY_PLOT_TITLE, bubble size defaults, etc.
    global_tm_min_for_color,
    global_tm_max_for_color
):
    """Generates the layout for the item ternary plot page.
    It now performs initial sizing and hover text generation.
    """
    logger.info(f"[{PAGE_PREFIX}] Generating layout...")

    # Extract necessary configs from page_specific_configs
    TERNARY_MIN_BUBBLE_SIZE_INIT = page_specific_configs.get('TERNARY_MIN_BUBBLE_SIZE', 1)
    TERNARY_MAX_BUBBLE_SIZE_INIT = page_specific_configs.get('TERNARY_MAX_BUBBLE_SIZE', 75)
    TERNARY_BUBBLE_SCALING_POWER_INIT = page_specific_configs.get('TERNARY_BUBBLE_SCALING_POWER', 3.0)
    PREPEND_ID_TO_LABEL_HOVER_INIT = page_specific_configs.get('PREPEND_ID_TO_LABEL_HOVER', True)
    TERNARY_PLOT_TITLE_INIT = page_specific_configs.get('TERNARY_PLOT_TITLE', "Item Ternary Plot")
    # current_plot_layout_config is essentially page_specific_configs for plotting aspects
    current_plot_layout_config = page_specific_configs

    search_input_id = f'{PAGE_PREFIX}-search-input'
    min_size_input_id = f'{PAGE_PREFIX}-min-size-input'
    max_size_input_id = f'{PAGE_PREFIX}-max-size-input'
    scaling_slider_id = f'{PAGE_PREFIX}-scaling-power-slider'
    visible_count_id = f'{PAGE_PREFIX}-visible-count'
    loading_id = f'{PAGE_PREFIX}-loading-mainplot'
    graph_id = f'{PAGE_PREFIX}-ternary-graph'

    df_for_initial_figure = pd.DataFrame() # Default to empty

    if df_with_base_attributes is not None and not df_with_base_attributes.empty:
        # 1. Perform initial sizing on the received data (which has P_X, TotalMentions)
        df_sized_for_layout = recalculate_bubble_sizes(
            df_with_base_attributes.copy(), # Make a copy before modifying
            TERNARY_MIN_BUBBLE_SIZE_INIT,
            TERNARY_MAX_BUBBLE_SIZE_INIT,
            TERNARY_BUBBLE_SCALING_POWER_INIT
        )

        # 2. Generate initial hover text
        id_c = current_data_config.get('id_col')
        label_c = current_data_config.get('label_col')
        if PREPEND_ID_TO_LABEL_HOVER_INIT and id_c in df_sized_for_layout.columns and label_c in df_sized_for_layout.columns:
            df_sized_for_layout['hover_text'] = df_sized_for_layout[id_c].astype(str) + ": " + df_sized_for_layout[label_c].astype(str)
        elif label_c in df_sized_for_layout.columns:
            df_sized_for_layout['hover_text'] = df_sized_for_layout[label_c].astype(str)
        elif id_c in df_sized_for_layout.columns:
            df_sized_for_layout['hover_text'] = df_sized_for_layout[id_c].astype(str)
        else:
            df_sized_for_layout['hover_text'] = "N/A"
        
        # 3. Prepare for plotting (ensure essential columns and dropna)
        axis_mapping_local = current_plot_layout_config.get('axis_mapping', {})
        prop_cols_for_plot = [
            axis_mapping_local.get('a_axis', {}).get('prop_col'),
            axis_mapping_local.get('b_axis', {}).get('prop_col'),
            axis_mapping_local.get('c_axis', {}).get('prop_col'),
            'size_px', # Ensure size_px is there for dropna
            'hover_text' # Ensure hover_text is there
        ]
        prop_cols_for_plot = [col for col in prop_cols_for_plot if col and col in df_sized_for_layout.columns]

        if prop_cols_for_plot:
            df_for_initial_figure = df_sized_for_layout.dropna(subset=prop_cols_for_plot, how='any').copy()
        else: # Should not happen if P_X cols and size_px are always present
            df_for_initial_figure = df_sized_for_layout.copy()
            logger.warning(f"[{PAGE_PREFIX}] Not all prop_cols_for_plot found in df_sized_for_layout for initial figure. Columns: {df_sized_for_layout.columns}")

    else:
        logger.warning(f"[{PAGE_PREFIX}] df_with_base_attributes is None or empty for layout. Plot will be empty.")

    page_layout_content = html.Div([
        html.H2(f"{TERNARY_PLOT_TITLE_INIT}", style={'textAlign': 'center'}), # Use specific title for this page
        html.H4(f"Data Source: {current_data_config.get('entity_type_label', 'Items')} (Interactive View)", style={'textAlign': 'center', 'color': '#555555', 'fontSize':'small'}),
        
        html.Div([ # Controls row
            html.Div([
                html.Label(f"Search {current_data_config.get('entity_type_label', 'Item')} by Label/ID:", style={'fontWeight': 'bold'}),
                dcc.Input(id=search_input_id, type='text', placeholder=f'Enter search term...', debounce=True, style={'width': '100%', 'padding': '8px', 'fontSize': '14px', 'marginTop': '5px'})
            ], style={'width': '30%', 'display': 'inline-block', 'marginRight': '2%', 'verticalAlign': 'top'}),
            html.Div([
                html.Label("Node Size Range (pixels):", style={'fontWeight': 'bold'}),
                html.Div([
                    dcc.Input(id=min_size_input_id, type='number', value=TERNARY_MIN_BUBBLE_SIZE_INIT, min=1, max=100, step=1, style={'width': '80px', 'padding': '8px', 'textAlign': 'center'}),
                    html.Span(" to ", style={'margin': '0 10px', 'lineHeight': '36px'}),
                    dcc.Input(id=max_size_input_id, type='number', value=TERNARY_MAX_BUBBLE_SIZE_INIT, min=1, max=100, step=1, style={'width': '80px', 'padding': '8px', 'textAlign': 'center'})
                ], style={'display': 'flex', 'alignItems': 'center', 'marginTop': '5px'})
            ], style={'width': '30%', 'display': 'inline-block', 'marginRight': '2%', 'verticalAlign': 'top'}),
            html.Div([
                html.Label("Size Scaling Power:", style={'fontWeight': 'bold'}),
                dcc.Slider(id=scaling_slider_id, min=0.1, max=5.0, step=0.1, value=TERNARY_BUBBLE_SCALING_POWER_INIT, marks={i/2: str(round(i/2,1)) for i in range(1, 11)}, tooltip={"placement": "bottom", "always_visible": True}),
            ], style={'width': '30%', 'display': 'inline-block', 'verticalAlign': 'top', 'paddingTop': '5px'})
        ], style={'display': 'flex', 'justifyContent': 'space-between', 'marginBottom': '20px', 'padding': '10px', 'border': '1px solid #ddd', 'borderRadius': '5px', 'backgroundColor': '#f9f9f9'}),
        
        html.Div(id=visible_count_id, style={'marginBottom': '15px', 'fontStyle': 'italic', 'textAlign': 'center', 'fontSize': '14px'}),
        
        dcc.Loading(id=loading_id, type="circle", children=[
            dcc.Graph(
                id=graph_id,
                figure=create_plotly_ternary_figure(
                    df_for_initial_figure,
                    current_data_config if current_data_config else {},
                    current_plot_layout_config if current_plot_layout_config else {},
                    global_tm_min_for_color,
                    global_tm_max_for_color
                )
            )
        ])
    ], style={'padding': '10px'})
    
    logger.info(f"[{PAGE_PREFIX}] Layout generation complete. Initial figure based on {len(df_for_initial_figure)} items.")
    return page_layout_content

def register_callbacks(
    app,
    df_with_base_attributes_closure, # Renamed: This is data with P_X, TotalMentions from app.py
    current_data_config_closure,
    page_specific_configs_closure, # Contains plot layout and other page-specific settings
    global_tm_min_for_color_closure,
    global_tm_max_for_color_closure
):
    """Registers callbacks for the item ternary plot page."""
    logger.info(f"[{PAGE_PREFIX}] Registering callbacks...")

    TERNARY_MIN_BUBBLE_SIZE_CB = page_specific_configs_closure.get('TERNARY_MIN_BUBBLE_SIZE', 1)
    TERNARY_MAX_BUBBLE_SIZE_CB = page_specific_configs_closure.get('TERNARY_MAX_BUBBLE_SIZE', 75)
    TERNARY_BUBBLE_SCALING_POWER_CB = page_specific_configs_closure.get('TERNARY_BUBBLE_SCALING_POWER', 3.0)
    PREPEND_ID_TO_LABEL_HOVER_CB = page_specific_configs_closure.get('PREPEND_ID_TO_LABEL_HOVER', True)
    current_plot_layout_config_cb = page_specific_configs_closure # This is the plot layout config

    search_input_id = f'{PAGE_PREFIX}-search-input'
    min_size_input_id = f'{PAGE_PREFIX}-min-size-input'
    max_size_input_id = f'{PAGE_PREFIX}-max-size-input'
    scaling_slider_id = f'{PAGE_PREFIX}-scaling-power-slider'
    visible_count_id = f'{PAGE_PREFIX}-visible-count'
    graph_id = f'{PAGE_PREFIX}-ternary-graph'

    @app.callback(
        [Output(graph_id, 'figure'), Output(visible_count_id, 'children')],
        [Input(search_input_id, 'value'),
         Input(min_size_input_id, 'value'),
         Input(max_size_input_id, 'value'),
         Input(scaling_slider_id, 'value')]
    )
    def update_ternary_plot(search_term, ui_min_size, ui_max_size, ui_scaling_power):
        logger.debug(f"[{PAGE_PREFIX}] Callback triggered. Search: '{search_term}', MinSize: {ui_min_size}, MaxSize: {ui_max_size}, Power: {ui_scaling_power}")

        data_config_cb = current_data_config_closure if current_data_config_closure else {}
        plot_layout_config_cb = current_plot_layout_config_cb if current_plot_layout_config_cb else {}
        
        if df_with_base_attributes_closure is None or df_with_base_attributes_closure.empty:
            logger.warning(f"[{PAGE_PREFIX}] Base data is empty in callback. Returning empty figure.")
            empty_fig = create_plotly_ternary_figure(pd.DataFrame(), data_config_cb, plot_layout_config_cb, 0, 1)
            return empty_fig, "No data available to display."

        min_s = int(ui_min_size) if ui_min_size is not None and str(ui_min_size).strip() else TERNARY_MIN_BUBBLE_SIZE_CB
        max_s = int(ui_max_size) if ui_max_size is not None and str(ui_max_size).strip() else TERNARY_MAX_BUBBLE_SIZE_CB
        scaling_p = float(ui_scaling_power) if ui_scaling_power is not None else TERNARY_BUBBLE_SCALING_POWER_CB

        if min_s <= 0: min_s = 1
        if max_s < min_s: max_s = min_s + 1
        
        # 1. Start with the base data (P_X, TotalMentions) and recalculate sizes
        df_globally_resized = recalculate_bubble_sizes(df_with_base_attributes_closure.copy(), min_s, max_s, scaling_p)
        
        # 2. Generate hover text on this resized DataFrame
        id_c = data_config_cb.get('id_col')
        label_c = data_config_cb.get('label_col')
        if PREPEND_ID_TO_LABEL_HOVER_CB and id_c in df_globally_resized.columns and label_c in df_globally_resized.columns:
            df_globally_resized['hover_text'] = df_globally_resized[id_c].astype(str) + ": " + df_globally_resized[label_c].astype(str)
        elif label_c in df_globally_resized.columns:
            df_globally_resized['hover_text'] = df_globally_resized[label_c].astype(str)
        elif id_c in df_globally_resized.columns: # Fallback if only ID is there
             df_globally_resized['hover_text'] = df_globally_resized[id_c].astype(str)
        else:
            df_globally_resized['hover_text'] = "N/A"

        # 3. Filter by search term
        df_display_subset = df_globally_resized # Start with resized and hover-texted data
        if search_term and search_term.strip():
            search_term_lower = search_term.lower().strip()
            label_col_s = data_config_cb.get('label_col')
            id_col_s = data_config_cb.get('id_col')
            
            label_matches = pd.Series([False]*len(df_display_subset), index=df_display_subset.index)
            if label_col_s and label_col_s in df_display_subset.columns:
                label_matches = df_display_subset[label_col_s].astype(str).str.lower().str.contains(search_term_lower, na=False)
            
            id_matches = pd.Series([False]*len(df_display_subset), index=df_display_subset.index)
            if id_col_s and id_col_s in df_display_subset.columns:
                id_matches = df_display_subset[id_col_s].astype(str).str.lower().str.contains(search_term_lower, na=False)
            
            df_display_subset = df_display_subset[label_matches | id_matches]
        
        # 4. Prepare for plotting (ensure essential columns and dropna)
        axis_mapping_local_cb = plot_layout_config_cb.get('axis_mapping', {})
        prop_cols_for_plot_cb = [
            axis_mapping_local_cb.get('a_axis', {}).get('prop_col'),
            axis_mapping_local_cb.get('b_axis', {}).get('prop_col'),
            axis_mapping_local_cb.get('c_axis', {}).get('prop_col'),
            'size_px', 'hover_text'
        ]
        prop_cols_for_plot_cb = [col for col in prop_cols_for_plot_cb if col and col in df_display_subset.columns]

        df_plot_ready = pd.DataFrame() 
        if not df_display_subset.empty and prop_cols_for_plot_cb:
            # Ensure all columns in prop_cols_for_plot_cb actually exist before trying to dropna on them
            existing_prop_cols = [col for col in prop_cols_for_plot_cb if col in df_display_subset.columns]
            if existing_prop_cols:
                 df_plot_ready = df_display_subset.dropna(subset=existing_prop_cols, how='any').copy()
            else: # Should not happen if P_X, size_px, hover_text are always generated
                 df_plot_ready = df_display_subset.copy() # Fallback
        
        # 5. Create figure
        updated_fig = create_plotly_ternary_figure(
            df_plot_ready,
            data_config_cb,
            plot_layout_config_cb,
            global_tm_min_for_color_closure,
            global_tm_max_for_color_closure
        )
        
        total_items_in_app = len(df_with_base_attributes_closure) if df_with_base_attributes_closure is not None else 0
        items_in_resized = len(df_globally_resized) if df_globally_resized is not None else 0
        count_text = (f"Displaying {len(df_plot_ready)} of {items_in_resized} items " +
                      (f"{'matching search ' if search_term and search_term.strip() else ''}") +
                      f"(Total available in app: {total_items_in_app} items).")
        
        logger.debug(f"[{PAGE_PREFIX}] Callback update_ternary_plot complete. Displaying {len(df_plot_ready)} items.")
        return updated_fig, count_text
    
    logger.info(f"[{PAGE_PREFIX}] Callbacks registered.")