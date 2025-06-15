# ngram_ternary_chart/src/pages/centroid_plot_page.py

import pandas as pd
import numpy as np
import plotly.graph_objects as go
import logging
from dash import dcc, html
from dash.dependencies import Input, Output

# --- Import from your project structure ---
from src.utils.ternary_data_utils import calculate_base_ternary_attributes
from src.utils.ternary_centroid_utils import (
    calculate_amplified_ternary_coordinates,
    calculate_weighted_group_centroids,
    calculate_categorical_item_centroids,
    assign_colors_to_centroids
)

logger = logging.getLogger(__name__)

# --- Prefix for component IDs on this page to ensure uniqueness ---
PAGE_PREFIX = "centroid-plot"

def layout(
    initial_amplification_power: float,
    country_dropdown_options: list,
    app_specific_data_config: dict,
    page_specific_configs: dict
):
    """Generates the layout for the centroid ternary plot page."""
    logger.info(f"[{PAGE_PREFIX}] Generating layout...")

    CENTROID_PLOT_TITLE_PREFIX_LAYOUT = page_specific_configs.get('CENTROID_PLOT_TITLE_PREFIX', "Amplified Centroids")
    entity_label_layout = app_specific_data_config.get('entity_type_label', 'Items') if app_specific_data_config else 'Items'

    slider_id = f'{PAGE_PREFIX}-amplification-power-slider'
    show_labels_checkbox_id = f'{PAGE_PREFIX}-show-country-labels-checkbox'
    country_dropdown_id = f'{PAGE_PREFIX}-country-dropdown'
    loading_id = f'{PAGE_PREFIX}-loading-plot'
    graph_id = f'{PAGE_PREFIX}-ternary-graph'
    status_id = f'{PAGE_PREFIX}-status-message'

    initial_figure = go.Figure()
    initial_figure.add_annotation(text="Initializing plot, select options and data will load...",
                                  xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False,
                                  font=dict(size=16))
    TERNARY_AXIS_MAPPING_LAYOUT = page_specific_configs.get('axis_mapping', {})
    initial_figure.update_layout(
        ternary=dict(
            sum=1,
            aaxis=dict(title=TERNARY_AXIS_MAPPING_LAYOUT.get('a_axis',{}).get('title','A-axis'), min=0.0),
            baxis=dict(title=TERNARY_AXIS_MAPPING_LAYOUT.get('b_axis',{}).get('title','B-axis'), min=0.0),
            caxis=dict(title=TERNARY_AXIS_MAPPING_LAYOUT.get('c_axis',{}).get('title','C-axis'), min=0.0)
        ),
        title_text=f"{CENTROID_PLOT_TITLE_PREFIX_LAYOUT} ({entity_label_layout})"
    )

    page_layout_content = html.Div([
        html.H2(f"{CENTROID_PLOT_TITLE_PREFIX_LAYOUT} ({entity_label_layout})", style={'textAlign': 'center'}),
        html.Div([ # Controls Row
            html.Div([ # Amplification Slider
                html.Label("Speech Difference Amplification:", style={'fontWeight': 'bold'}),
                dcc.Slider(
                    id=slider_id, min=1.0, max=3.0, step=0.5,
                    value=initial_amplification_power,
                    marks={i / 2: str(round(i / 2, 1)) for i in range(1, 11)},
                    tooltip={"placement": "bottom", "always_visible": True}
                )
            ], style={'width': '30%', 'display': 'inline-block', 'padding': '10px', 'verticalAlign': 'top'}),

            html.Div([ # Country Dropdown
                html.Label("Select Country Centroids:", style={'fontWeight': 'bold'}),
                dcc.Dropdown(
                    id=country_dropdown_id,
                    options=country_dropdown_options,
                    value=[],
                    multi=True,
                    placeholder="Select countries to display...",
                    style={'marginTop': '5px'}
                )
            ], style={'width': '35%', 'display': 'inline-block', 'padding': '10px', 'verticalAlign': 'top'}),

            html.Div([ # Show Country Labels Checkbox
                dcc.Checklist(
                    id=show_labels_checkbox_id,
                    options=[{'label': ' Show country labels', 'value': 'SHOW_LABELS'}],
                    value=[], 
                    style={'display': 'inline-block', 'marginLeft': '10px', 'marginTop': '30px'}
                )
            ], style={'width': '25%', 'display': 'inline-block', 'padding': '10px', 'verticalAlign': 'bottom'})

        ], style={'display': 'flex', 'justifyContent': 'space-around', 'alignItems': 'flex-start', 'marginBottom': '20px', 'border': '1px solid #ddd', 'borderRadius': '5px', 'backgroundColor': '#f9f9f9'}),
        
        dcc.Loading(id=loading_id, type="circle", children=[
            dcc.Graph(id=graph_id, figure=initial_figure, style={'height': '800px'})
        ]),
        html.Div(id=status_id, style={'marginTop': '10px', 'textAlign': 'center', 'fontStyle': 'italic'})
    ], style={'padding': '10px'})
    
    logger.info(f"[{PAGE_PREFIX}] Layout generation complete.")
    return page_layout_content

def register_callbacks(
    app,
    df_base_items_loaded_closure,
    df_country_ngram_weights_loaded_closure,
    df_country_table_info_loaded_closure,
    app_specific_data_config_closure,
    page_specific_configs_closure
):
    logger.info(f"[{PAGE_PREFIX}] Registering callbacks...")

    TERNARY_AXIS_MAPPING_CB = page_specific_configs_closure.get('axis_mapping', {})
    CENTROID_GROUP_DEFINITIONS_CB = page_specific_configs_closure.get('CENTROID_GROUP_DEFINITIONS', {})
    CENTROID_GROUP_MARKER_SIZE_CB = page_specific_configs_closure.get('CENTROID_GROUP_MARKER_SIZE', 20)
    CENTROID_PLOT_TITLE_PREFIX_CB = page_specific_configs_closure.get('CENTROID_PLOT_TITLE_PREFIX', "Amplified Centroids")
    
    DEFAULT_COUNTRIES_TO_PLOT_CB = page_specific_configs_closure.get('COUNTRIES_TO_PLOT_CENTROIDS_FOR', None)
    # COUNTRY_CENTROID_LABEL_PREFIX_CB is used by calculate_categorical_item_centroids to create the 'label' (hover) column
    COUNTRY_CENTROID_MARKER_SYMBOL_CB = page_specific_configs_closure.get('COUNTRY_CENTROID_MARKER_SYMBOL', "circle")
    COUNTRY_CENTROID_MARKER_SIZE_CB = page_specific_configs_closure.get('COUNTRY_CENTROID_MARKER_SIZE', 15)
    CPM_COMMUNITY_TO_COLOR_MAP_CB = page_specific_configs_closure.get('CPM_COMMUNITY_TO_COLOR_MAP', {})
    COUNTRY_KEYWORD_USAGE_LABEL_CB = page_specific_configs_closure.get('COUNTRY_KEYWORD_USAGE_LABEL', "Count of keyword usage:")
    COUNTRY_TEXT_LABEL_FONT_SIZE_CB = page_specific_configs_closure.get('COUNTRY_TEXT_LABEL_FONT_SIZE', 8) # Smaller default
    COUNTRY_TEXT_LABEL_POSITION_CB = page_specific_configs_closure.get('COUNTRY_TEXT_LABEL_POSITION', "middle right") # Changed default for closeness

    US_LIKE_COMMUNITIES = ['A']
    RUSSIA_LIKE_COMMUNITIES = ['G']
    MIDDLE_GROUND_COMMUNITIES = ['B', 'C', 'D', 'E']
    OTHER_EDGE_COMMUNITIES = ['F'] 

    COUNTRY_COMMUNITY_GROUPING_COL_NAME = 'cpm_community_after_10_CPM_0_53'
    # This is the column in the output of calculate_categorical_item_centroids
    # that holds the raw category ID (e.g., country code) before prefixing.
    # It's often the same as 'category_col_in_weights' or the index name.
    # Let's assume calculate_categorical_item_centroids makes 'country_speaker' available.
    RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT = 'country_speaker'


    slider_id = f'{PAGE_PREFIX}-amplification-power-slider'
    show_labels_checkbox_id = f'{PAGE_PREFIX}-show-country-labels-checkbox'
    country_dropdown_id = f'{PAGE_PREFIX}-country-dropdown'
    graph_id = f'{PAGE_PREFIX}-ternary-graph'
    status_id = f'{PAGE_PREFIX}-status-message'

    @app.callback(
        [Output(graph_id, 'figure'), Output(status_id, 'children')],
        [Input(slider_id, 'value'),
         Input(show_labels_checkbox_id, 'value'),
         Input(country_dropdown_id, 'value')]
    )
    def update_centroid_plot(selected_power: float, 
                             show_labels_checklist_values: list,
                             selected_countries_iso: list):
        logger.debug(f"[{PAGE_PREFIX}] Callback: Power={selected_power}, ShowLabelsCheck={show_labels_checklist_values}, SelectedCountriesISO={selected_countries_iso}")
        status_message = ""
        fig = go.Figure()

        should_show_country_labels_cb = 'SHOW_LABELS' in show_labels_checklist_values

        data_config_cb = app_specific_data_config_closure if app_specific_data_config_closure else {}
        df_base_items_for_callback = df_base_items_loaded_closure.copy() if df_base_items_loaded_closure is not None and not df_base_items_loaded_closure.empty else pd.DataFrame()
        
        if df_base_items_for_callback.empty:
            status_message = "Error: Base item data is missing or empty for centroid calculation."
            logger.error(f"[{PAGE_PREFIX}] {status_message}")
            fig.add_annotation(text=status_message, xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
            fig.update_layout(ternary=dict(sum=1, aaxis=dict(title='A'),baxis=dict(title='B'),caxis=dict(title='C')), title_text=f"{CENTROID_PLOT_TITLE_PREFIX_CB} (Error: No Data)")
            return fig, status_message

        df_with_P_initial = calculate_base_ternary_attributes(df_base_items_for_callback, data_config_cb)
        df_with_P_initial.dropna(subset=['P_US', 'P_Russia', 'P_Middle'], inplace=True)
        if df_with_P_initial.empty:
            status_message = "Error: No items with valid P_X coordinates after base attribute calculation."
            logger.error(f"[{PAGE_PREFIX}] {status_message}")
            fig.add_annotation(text=status_message, xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
            fig.update_layout(ternary=dict(sum=1, aaxis=dict(title='A'),baxis=dict(title='B'),caxis=dict(title='C')), title_text=f"{CENTROID_PLOT_TITLE_PREFIX_CB} (Error)")
            return fig, status_message

        df_items_amplified = calculate_amplified_ternary_coordinates(df_with_P_initial.copy(), selected_power)
        df_items_amplified.dropna(subset=['P_US_amp', 'P_Russia_amp', 'P_Middle_amp'], inplace=True)
        if df_items_amplified.empty:
            status_message = "Error: No items with valid amplified coordinates."
            logger.error(f"[{PAGE_PREFIX}] {status_message}")
            fig.add_annotation(text=status_message, xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False)
            fig.update_layout(ternary=dict(sum=1, aaxis=dict(title='A'),baxis=dict(title='B'),caxis=dict(title='C')), title_text=f"{CENTROID_PLOT_TITLE_PREFIX_CB} (Error)")
            return fig, status_message
            
        processed_group_definitions_for_cb = {}
        for group_name, definition in CENTROID_GROUP_DEFINITIONS_CB.items():
            actual_weight_col = data_config_cb.get(definition['weight_col_key'])
            if actual_weight_col:
                proc_def = definition.copy(); proc_def["weight_col_name"] = actual_weight_col
                if 'weight_col_key' in proc_def: del proc_def['weight_col_key']
                processed_group_definitions_for_cb[group_name] = proc_def
        df_group_centroids = pd.DataFrame()
        if processed_group_definitions_for_cb:
            df_group_centroids = calculate_weighted_group_centroids(df_items_amplified.copy(), processed_group_definitions_for_cb, 'P_US_amp', 'P_Russia_amp', 'P_Middle_amp')

        df_country_centroids_to_plot = pd.DataFrame()
        
        df_country_weights_cb = df_country_ngram_weights_loaded_closure.copy() if df_country_ngram_weights_loaded_closure is not None and not df_country_ngram_weights_loaded_closure.empty else pd.DataFrame()
        df_country_info_cb = df_country_table_info_loaded_closure.copy() if df_country_table_info_loaded_closure is not None and not df_country_table_info_loaded_closure.empty else pd.DataFrame()

        page_data_source_label = data_config_cb.get('entity_type_label', 'items')
        if 'ngram' not in page_data_source_label.lower(): status_message += " Note: Country centroids are typically for 'ngrams'. "
        
        if df_country_weights_cb.empty or df_country_info_cb.empty:
            status_message += " Country weight or info data missing. Cannot plot country centroids."
        else:
            item_id_col_for_country_cb = data_config_cb.get('id_col', 'ngram_id')
            centroid_label_prefix_for_hover = page_specific_configs_closure.get('COUNTRY_CENTROID_LABEL_PREFIX', "Centroid: ") # Get prefix for hover
            
            countries_for_calculation_cb = selected_countries_iso
            if not selected_countries_iso: 
                if DEFAULT_COUNTRIES_TO_PLOT_CB is not None: 
                    countries_for_calculation_cb = DEFAULT_COUNTRIES_TO_PLOT_CB
                else: 
                    countries_for_calculation_cb = None 
            
            if isinstance(countries_for_calculation_cb, list) and not countries_for_calculation_cb:
                 logger.info(f"[{PAGE_PREFIX}] No countries selected or defaulted for centroid calculation.")
                 temp_df_country_centroids = pd.DataFrame()
            else:
                temp_df_country_centroids = calculate_categorical_item_centroids(
                    df_items_with_coords=df_items_amplified.copy(),
                    df_category_weights=df_country_weights_cb,
                    item_id_col=item_id_col_for_country_cb,
                    category_col_in_weights=RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT, # e.g. 'country_speaker'
                    category_weight_col='count_sentences_for_ngram_by_country',
                    categories_to_process=countries_for_calculation_cb,
                    centroid_label_prefix=centroid_label_prefix_for_hover, # For 'label' column (hover)
                    default_marker_symbol=COUNTRY_CENTROID_MARKER_SYMBOL_CB,
                    default_marker_color="grey" 
                )
                # Ensure RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT is a column if it was the index
                if RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT not in temp_df_country_centroids.columns and \
                   temp_df_country_centroids.index.name == RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT:
                    temp_df_country_centroids.reset_index(inplace=True)


            if not temp_df_country_centroids.empty:
                if COUNTRY_COMMUNITY_GROUPING_COL_NAME not in df_country_info_cb.columns:
                    status_message += f" Error: Country info data missing '{COUNTRY_COMMUNITY_GROUPING_COL_NAME}' column for color assignment. Cannot group country centroids."
                    logger.error(f"[{PAGE_PREFIX}] {status_message}")
                    df_country_centroids_to_plot = temp_df_country_centroids.copy()
                    df_country_centroids_to_plot['marker_color_final'] = CPM_COMMUNITY_TO_COLOR_MAP_CB.get('DEFAULT', 'darkgrey') 
                    if COUNTRY_COMMUNITY_GROUPING_COL_NAME not in df_country_centroids_to_plot.columns:
                         df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME] = pd.NA
                else:
                    df_country_centroids_to_plot = assign_colors_to_centroids(
                        df_centroids=temp_df_country_centroids,
                        df_category_info=df_country_info_cb,
                        centroid_category_col=RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT, # Join on raw country ID
                        info_category_id_col='id',             
                        info_grouping_col=COUNTRY_COMMUNITY_GROUPING_COL_NAME, 
                        color_map=CPM_COMMUNITY_TO_COLOR_MAP_CB,
                        default_color_key='DEFAULT',
                        output_color_col_name='marker_color_final'
                    )
                    if COUNTRY_COMMUNITY_GROUPING_COL_NAME not in df_country_centroids_to_plot.columns:
                         logger.error(f"[{PAGE_PREFIX}] Critical: Column '{COUNTRY_COMMUNITY_GROUPING_COL_NAME}' is STILL missing from df_country_centroids_to_plot after assign_colors_to_centroids. Grouping for legend will fail.")
                         df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME] = pd.NA
                         status_message += f" Warning: Grouping column '{COUNTRY_COMMUNITY_GROUPING_COL_NAME}' missing after color assignment. Legend will be affected."

            elif (selected_countries_iso or DEFAULT_COUNTRIES_TO_PLOT_CB is None): 
                status_message += " No country centroids calculated for selected/available countries."
        
        if not df_group_centroids.empty:
            custom_data_gc = df_group_centroids[['P_US_centroid', 'P_Russia_centroid', 'P_Middle_centroid', 'total_weight_for_group']].values
            hovertemplate_gc = ("<b>%{hovertext}</b><br><br>" + f"{TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('title','A')}: %{{customdata[2]:.3f}}<br>" + f"{TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('title','B')}: %{{customdata[1]:.3f}}<br>" + f"{TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('title','C')}: %{{customdata[0]:.3f}}<br>" + "Total Weight: %{customdata[3]:.0f}<extra></extra>")
            fig.add_trace(go.Scatterternary(a=df_group_centroids[TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('prop_col', 'P_Middle') + '_centroid'],b=df_group_centroids[TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('prop_col', 'P_Russia') + '_centroid'],c=df_group_centroids[TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('prop_col', 'P_US') + '_centroid'],mode='markers+text', name='Main Group Centroids',marker=dict(symbol=df_group_centroids['marker_symbol'], color=df_group_centroids['marker_color'], size=CENTROID_GROUP_MARKER_SIZE_CB, line=dict(width=1, color='black')),text=df_group_centroids['centroid_group_name'], textposition="top right",hovertext=df_group_centroids['label'], customdata=custom_data_gc, hovertemplate=hovertemplate_gc,legendgroup="group_centroids", showlegend=True))

        if not df_country_centroids_to_plot.empty and \
           COUNTRY_COMMUNITY_GROUPING_COL_NAME in df_country_centroids_to_plot.columns and \
           df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME].notna().any():
            
            logger.info(f"[{PAGE_PREFIX}] Attempting to plot country centroids grouped by community. Show labels: {should_show_country_labels_cb}")
            
            country_categories_for_legend = [
                {"name": "US-like-voting countries", "communities": US_LIKE_COMMUNITIES, "legendgroup": "country_centroids_us"},
                {"name": "Russia-like-voting countries", "communities": RUSSIA_LIKE_COMMUNITIES, "legendgroup": "country_centroids_russia"},
                {"name": "Middle-ground countries", "communities": MIDDLE_GROUND_COMMUNITIES, "legendgroup": "country_centroids_middle"},
                {"name": "Other countries (edge cases)", "communities": OTHER_EDGE_COMMUNITIES, "legendgroup": "country_centroids_other"}
            ]
            
            specified_communities_for_legend = set()
            for cat_info in country_categories_for_legend:
                specified_communities_for_legend.update(cat_info["communities"])

            country_plot_mode = 'markers+text' if should_show_country_labels_cb else 'markers'
            
            for category_info in country_categories_for_legend:
                df_cat_countries = df_country_centroids_to_plot[
                    df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME].isin(category_info["communities"])
                ]

                if not df_cat_countries.empty:
                    custom_data_cc = df_cat_countries[['P_US_centroid', 'P_Russia_centroid', 'P_Middle_centroid', 'total_weight_for_group']].values
                    hovertemplate_cc = ("<b>%{hovertext}</b><br><br>" + # Hovertext uses the 'label' column (with prefix)
                                       f"{TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('title','A')}: %{{customdata[2]:.3f}}<br>" +
                                       f"{TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('title','B')}: %{{customdata[1]:.3f}}<br>" +
                                       f"{TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('title','C')}: %{{customdata[0]:.3f}}<br>" +
                                       f"{COUNTRY_KEYWORD_USAGE_LABEL_CB} %{{customdata[3]:.0f}}<extra></extra>")
                    
                    trace_text_val = None
                    if should_show_country_labels_cb:
                        if RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT in df_cat_countries.columns:
                            trace_text_val = df_cat_countries[RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT]
                        elif 'label' in df_cat_countries.columns: # Fallback if raw ID col not found
                            logger.warning(f"[{PAGE_PREFIX}] Raw ID column '{RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT}' not found. Using full 'label' for display text.")
                            trace_text_val = df_cat_countries['label']
                        else:
                            logger.warning(f"[{PAGE_PREFIX}] No suitable column for display text.")
                    
                    fig.add_trace(go.Scatterternary(
                        a=df_cat_countries[TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('prop_col', 'P_Middle') + '_centroid'],
                        b=df_cat_countries[TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('prop_col', 'P_Russia') + '_centroid'],
                        c=df_cat_countries[TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('prop_col', 'P_US') + '_centroid'],
                        mode=country_plot_mode, 
                        text=trace_text_val, # Text on plot uses raw ID
                        textfont=dict(size=COUNTRY_TEXT_LABEL_FONT_SIZE_CB),
                        textposition=COUNTRY_TEXT_LABEL_POSITION_CB,
                        name=category_info["name"],
                        marker=dict(
                            symbol=df_cat_countries['marker_symbol'], 
                            color=df_cat_countries['marker_color_final'], 
                            size=COUNTRY_CENTROID_MARKER_SIZE_CB, 
                            line=dict(width=1, color='DarkSlateGrey')
                        ),
                        hovertext=df_cat_countries['label'], # Hovertext uses full 'label' (with prefix)
                        customdata=custom_data_cc, 
                        hovertemplate=hovertemplate_cc,
                        legendgroup=category_info["legendgroup"], 
                        showlegend=True
                    ))
            
            df_unspecified_countries = df_country_centroids_to_plot[
                ~df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME].isin(specified_communities_for_legend) &
                df_country_centroids_to_plot[COUNTRY_COMMUNITY_GROUPING_COL_NAME].notna()
            ]
            if not df_unspecified_countries.empty:
                logger.warning(f"[{PAGE_PREFIX}] Found {len(df_unspecified_countries)} countries with communities not explicitly defined for legend: {df_unspecified_countries[COUNTRY_COMMUNITY_GROUPING_COL_NAME].unique()}. Plotting as 'Uncategorized Countries'.")
                custom_data_for_hover_uc = np.hstack((
                    df_unspecified_countries[['P_US_centroid', 'P_Russia_centroid', 'P_Middle_centroid', 'total_weight_for_group']].values,
                    df_unspecified_countries[[COUNTRY_COMMUNITY_GROUPING_COL_NAME]].values 
                ))
                hovertemplate_uc = ("<b>%{hovertext}</b><br>(Uncategorized Community: %{customdata[4]})<br><br>" +
                                   f"{TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('title','A')}: %{{customdata[2]:.3f}}<br>" +
                                   f"{TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('title','B')}: %{{customdata[1]:.3f}}<br>" +
                                   f"{TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('title','C')}: %{{customdata[0]:.3f}}<br>" +
                                   f"{COUNTRY_KEYWORD_USAGE_LABEL_CB} %{{customdata[3]:.0f}}<extra></extra>")
                
                trace_text_uc_val = None
                if should_show_country_labels_cb:
                    if RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT in df_unspecified_countries.columns:
                        trace_text_uc_val = df_unspecified_countries[RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT]
                    elif 'label' in df_unspecified_countries.columns:
                        trace_text_uc_val = df_unspecified_countries['label']

                fig.add_trace(go.Scatterternary(
                    a=df_unspecified_countries[TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('prop_col', 'P_Middle') + '_centroid'],
                    b=df_unspecified_countries[TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('prop_col', 'P_Russia') + '_centroid'],
                    c=df_unspecified_countries[TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('prop_col', 'P_US') + '_centroid'],
                    mode=country_plot_mode, 
                    text=trace_text_uc_val,
                    textfont=dict(size=COUNTRY_TEXT_LABEL_FONT_SIZE_CB),
                    textposition=COUNTRY_TEXT_LABEL_POSITION_CB,
                    name='Uncategorized Countries',
                    marker=dict(
                        symbol=df_unspecified_countries['marker_symbol'], 
                        color=df_unspecified_countries['marker_color_final'], 
                        size=COUNTRY_CENTROID_MARKER_SIZE_CB, 
                        line=dict(width=1, color='DarkSlateGrey')
                    ),
                    hovertext=df_unspecified_countries['label'], 
                    customdata=custom_data_for_hover_uc, 
                    hovertemplate=hovertemplate_uc,
                    legendgroup="country_centroids_uncategorized", 
                    showlegend=True
                ))

        elif not df_country_centroids_to_plot.empty: 
            warning_msg = f"[{PAGE_PREFIX}] Fallback: Plotting all country centroids in a single group because grouping column '{COUNTRY_COMMUNITY_GROUPING_COL_NAME}' is missing or has no valid data."
            logger.warning(warning_msg)
            status_message += f" {warning_msg}"
            
            custom_data_cc = df_country_centroids_to_plot[['P_US_centroid', 'P_Russia_centroid', 'P_Middle_centroid', 'total_weight_for_group']].values
            hovertemplate_cc = ("<b>%{hovertext}</b><br><br>" +
                               f"{TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('title','A')}: %{{customdata[2]:.3f}}<br>" +
                               f"{TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('title','B')}: %{{customdata[1]:.3f}}<br>" +
                               f"{TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('title','C')}: %{{customdata[0]:.3f}}<br>" +
                               f"{COUNTRY_KEYWORD_USAGE_LABEL_CB} %{{customdata[3]:.0f}}<extra></extra>")
            
            country_plot_mode_fallback = 'markers+text' if should_show_country_labels_cb else 'markers'
            trace_text_fallback_val = None
            if should_show_country_labels_cb:
                if RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT in df_country_centroids_to_plot.columns:
                    trace_text_fallback_val = df_country_centroids_to_plot[RAW_COUNTRY_ID_COL_FOR_DISPLAY_TEXT]
                elif 'label' in df_country_centroids_to_plot.columns:
                     trace_text_fallback_val = df_country_centroids_to_plot['label']

            fig.add_trace(go.Scatterternary(
                a=df_country_centroids_to_plot[TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('prop_col', 'P_Middle') + '_centroid'],
                b=df_country_centroids_to_plot[TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('prop_col', 'P_Russia') + '_centroid'],
                c=df_country_centroids_to_plot[TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('prop_col', 'P_US') + '_centroid'],
                mode=country_plot_mode_fallback, 
                text=trace_text_fallback_val,
                textfont=dict(size=COUNTRY_TEXT_LABEL_FONT_SIZE_CB),
                textposition=COUNTRY_TEXT_LABEL_POSITION_CB,
                name='Country Centroids (Ungrouped)',
                marker=dict(
                    symbol=df_country_centroids_to_plot.get('marker_symbol', COUNTRY_CENTROID_MARKER_SYMBOL_CB), 
                    color=df_country_centroids_to_plot.get('marker_color_final', CPM_COMMUNITY_TO_COLOR_MAP_CB.get('DEFAULT', 'darkgrey')), 
                    size=COUNTRY_CENTROID_MARKER_SIZE_CB, 
                    line=dict(width=1, color='DarkSlateGrey')
                ),
                hovertext=df_country_centroids_to_plot['label'], 
                customdata=custom_data_cc, 
                hovertemplate=hovertemplate_cc,
                legendgroup="country_centroids_fallback", 
                showlegend=True
            ))

        if not fig.data: status_message = "No centroid data to display for current settings."
        
        fig.update_layout(
            uirevision=f"{PAGE_PREFIX}-plot-update-{selected_power}-{should_show_country_labels_cb}-{str(selected_countries_iso)}",
            title_text=f"{CENTROID_PLOT_TITLE_PREFIX_CB} (Power: {selected_power})",
            margin=dict(l=100, r=120, t=80, b=60), ternary=dict(sum=1, aaxis=dict(title=TERNARY_AXIS_MAPPING_CB.get('a_axis',{}).get('title','A-axis'), min=0.0, linewidth=1.5, tickfont={'size': 10}), baxis=dict(title=TERNARY_AXIS_MAPPING_CB.get('b_axis',{}).get('title','B-axis'), min=0.0, linewidth=1.5, tickfont={'size': 10}), caxis=dict(title=TERNARY_AXIS_MAPPING_CB.get('c_axis',{}).get('title','C-axis'), min=0.0, linewidth=1.5, tickfont={'size': 10}), bgcolor="#f0f0f0"), legend_title_text='Centroid Types', hoverlabel=dict(bgcolor="white", font_size=12)
        )
        
        if not status_message:
            status_message = f"Plot updated. Power: {selected_power}. Labels: {'Shown' if should_show_country_labels_cb else 'Hidden'}."
            if selected_countries_iso :
                status_message += f" Selected countries: {len(selected_countries_iso)}."
            elif not selected_countries_iso and DEFAULT_COUNTRIES_TO_PLOT_CB is None:
                 status_message += " Displaying all available country centroids."
            elif not selected_countries_iso and DEFAULT_COUNTRIES_TO_PLOT_CB:
                 status_message += f" Displaying default list of {len(DEFAULT_COUNTRIES_TO_PLOT_CB)} country centroids."

        logger.debug(f"[{PAGE_PREFIX}] Callback complete. Status: {status_message}")
        return fig, status_message
    
    logger.info(f"[{PAGE_PREFIX}] Callbacks registered.")