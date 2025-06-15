# ngram_ternary_chart/app.py

import pandas as pd
import numpy as np
import plotly.graph_objects as go
import logging
import os
import json

from dash import Dash, dcc, html
from dash.dependencies import Input, Output, State # State might be needed by pages

from src.config import AppConfig
try:
    from src.models.db_models import engine, SessionLocal, \
        BertLabelledTopicCommunityStats, AILabelledTopicCommunityStats, AnalysisNgramCommunityStats
    if engine is None and SessionLocal is not None:
        logging.warning("Engine was None in db_models.py, attempting to re-create from AppConfig for main app.")
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        db_path_str = str(AppConfig.DB_FILE)
        if not os.path.isabs(db_path_str):
            db_path_str = str(AppConfig.PROJECT_ROOT_DIR / 'data' / AppConfig.DB_FILE.name)
        engine = create_engine(f"sqlite:///{db_path_str}", connect_args={"check_same_thread": False})
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        logging.info(f"Re-created engine for main app, connected to: {db_path_str}")
    
    class AppMockDBClassShared:
        __tablename__ = "app_mock_db_class_shared"
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
    
    logging.info("Main App: Successfully imported database models and engine from src.models.")
except ImportError as e:
    logging.error(f"Main App: Failed to import DB models or engine: {e}. Using full mock setup.", exc_info=True)
    engine = None
    SessionLocal = None
    
    class AppMockDBClassShared:
        __tablename__ = "app_mock_table_shared_fallback"
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)
                
    BertLabelledTopicCommunityStats, AILabelledTopicCommunityStats, AnalysisNgramCommunityStats = AppMockDBClassShared, AppMockDBClassShared, AppMockDBClassShared

from src.utils.ternary_data_utils import load_data_for_ternary, calculate_base_ternary_attributes
from src.pages import item_plot_page, centroid_plot_page

logging.basicConfig(level=os.environ.get("LOG_LEVEL", "INFO").upper(), format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

SHARED_DATA_CONFIGS = {
    'bert': { 'model_class': BertLabelledTopicCommunityStats, 'id_col': 'topic_id', 'label_col': 'topic_short_description', 'us_count_col': 'count_A', 'russia_count_col': 'count_G', 'middle_count_col': 'count_BCDE', 'entity_type_label': "BERT Topic"},
    'ai': { 'model_class': AILabelledTopicCommunityStats, 'id_col': 'topic_id', 'label_col': 'topic_short_description', 'us_count_col': 'count_A', 'russia_count_col': 'count_G', 'middle_count_col': 'count_BCDE', 'entity_type_label': "AI Topic"},
    'ngrams': { 'model_class': AnalysisNgramCommunityStats, 'id_col': 'ngram_id', 'label_col': 'ngram', 'us_count_col': 'count_A', 'russia_count_col': 'count_G', 'middle_count_col': 'count_BCDE', 'entity_type_label': "Ngram"}
}

ITEM_PLOT_DATA_SOURCE_KEY = os.getenv("ITEM_PLOT_DATA_SOURCE_KEY", 'ngrams')
_item_model_id_str = os.getenv("ITEM_PLOT_MODEL_ID_TO_ANALYZE", "None")
ITEM_PLOT_MODEL_ID_TO_ANALYZE = None
if _item_model_id_str.lower() != 'none' and _item_model_id_str != '':
    try: ITEM_PLOT_MODEL_ID_TO_ANALYZE = int(_item_model_id_str)
    except ValueError: logger.warning(f"Invalid ITEM_PLOT_MODEL_ID_TO_ANALYZE: '{_item_model_id_str}'. Using None.")
_items_to_display_str = os.getenv("ITEM_PLOT_ITEMS_TO_DISPLAY", None)
ITEM_PLOT_ITEMS_TO_DISPLAY = None
if _items_to_display_str:
    try: ITEM_PLOT_ITEMS_TO_DISPLAY = json.loads(_items_to_display_str)
    except json.JSONDecodeError: ITEM_PLOT_ITEMS_TO_DISPLAY = [item.strip() for item in _items_to_display_str.split(',')]
ITEM_PLOT_PAGE_SPECIFIC_CONFIGS = {
    'PREPEND_ID_TO_LABEL_HOVER': os.getenv("ITEM_PLOT_PREPEND_ID_HOVER", "True").lower() == "true",
    'TERNARY_MIN_BUBBLE_SIZE': int(os.getenv("ITEM_PLOT_MIN_BUBBLE_SIZE", 1)),
    'TERNARY_MAX_BUBBLE_SIZE': int(os.getenv("ITEM_PLOT_MAX_BUBBLE_SIZE", 75)),
    'TERNARY_BUBBLE_SCALING_POWER': float(os.getenv("ITEM_PLOT_BUBBLE_SCALING_POWER", 3.0)),
    'TERNARY_COLOR_BY_TOTAL_MENTIONS': os.getenv("ITEM_PLOT_COLOR_BY_MENTIONS", "True").lower() == "true",
    'TERNARY_COLOR_CONTINUOUS_SCALE_LOW': os.getenv("ITEM_PLOT_COLOR_SCALE_LOW", "#ffba00"),
    'TERNARY_COLOR_CONTINUOUS_SCALE_HIGH': os.getenv("ITEM_PLOT_COLOR_SCALE_HIGH", "#6d6559"),
    'TERNARY_PLOT_TITLE': os.getenv("ITEM_PLOT_PLOT_TITLE", "Share of Keyword Usage by Group (Item Plot)"),
    'TERNARY_COLORBAR_TITLE': os.getenv("ITEM_PLOT_COLORBAR_TITLE", "Total Mentions"),
    'axis_mapping': {'a_axis': {'prop_col': 'P_Middle', 'title': "Middle-ground Share"}, 'b_axis': {'prop_col': 'P_Russia', 'title': "Russia-like-voting Share"}, 'c_axis': {'prop_col': 'P_US', 'title': "US-like-voting Share"}}
}

CENTROID_PLOT_DATA_SOURCE_KEY = os.getenv("CENTROID_PLOT_DATA_SOURCE_KEY", 'ngrams')
_centroid_model_id_str = os.getenv("CENTROID_PLOT_MODEL_ID_TO_ANALYZE", "None")
CENTROID_PLOT_MODEL_ID_TO_ANALYZE = None
if _centroid_model_id_str.lower() != 'none' and _centroid_model_id_str != '':
    try: CENTROID_PLOT_MODEL_ID_TO_ANALYZE = int(_centroid_model_id_str)
    except ValueError: logger.warning(f"Invalid CENTROID_PLOT_MODEL_ID_TO_ANALYZE: '{_centroid_model_id_str}'. Using None.")
CENTROID_PLOT_PAGE_SPECIFIC_CONFIGS = {
    'AMPLIFICATION_POWER_DEFAULT': float(os.getenv("CENTROID_PLOT_AMP_POWER", 2.0)), # Ensure this default is 1.0-3.0
    # 'PLOT_COUNTRY_CENTROIDS_DEFAULT' is no longer used by centroid_plot_page.py
    'CENTROID_PLOT_TITLE_PREFIX': os.getenv("CENTROID_PLOT_TITLE_PREFIX", "'Centres' of Country and Voting Group Speech"),
    'axis_mapping': ITEM_PLOT_PAGE_SPECIFIC_CONFIGS['axis_mapping'],
    'CENTROID_GROUP_DEFINITIONS': {"US_Focus": {"weight_col_key": "us_count_col", "label": "US Centroid (Amplified)", "marker_symbol": "diamond", "marker_color": "blue"}, "Russia_Focus": {"weight_col_key": "russia_count_col", "label": "Russia Centroid (Amplified)", "marker_symbol": "diamond", "marker_color": "red"}, "Middle_Focus": {"weight_col_key": "middle_count_col", "label": "Middle Ground Centroid (Amplified)", "marker_symbol": "diamond", "marker_color": "green"}},
    'CENTROID_GROUP_MARKER_SIZE': int(os.getenv("CENTROID_PLOT_GROUP_MARKER_SIZE", 20)),
    'COUNTRIES_TO_PLOT_CENTROIDS_FOR': None,
    'COUNTRY_CENTROID_LABEL_PREFIX': os.getenv("CENTROID_PLOT_COUNTRY_LABEL_PREFIX", "Centroid: "), # Used for hover
    'COUNTRY_CENTROID_MARKER_SYMBOL': "circle",
    'COUNTRY_CENTROID_MARKER_COLOR': "purple", # Default, but overridden by CPM map
    'COUNTRY_CENTROID_MARKER_SIZE': int(os.getenv("CENTROID_PLOT_COUNTRY_MARKER_SIZE", 15)),
    'CPM_COMMUNITY_TO_COLOR_MAP': {'A': "blue", 'G': "red", 'B': "green", 'C': "green", 'D': "green", 'E': "green", 'F': 'grey', 'DEFAULT': 'darkgrey'},
    'COUNTRY_KEYWORD_USAGE_LABEL': "Count of keyword usage:",
    'COUNTRY_TEXT_LABEL_FONT_SIZE': int(os.getenv("CENTROID_PLOT_LABEL_FONT_SIZE", 8)), 
    'COUNTRY_TEXT_LABEL_POSITION': os.getenv("CENTROID_PLOT_LABEL_POSITION", "middle right")
}

logger.info(f"--- Main App: Initializing Data ---")
item_plot_current_data_config_dict = SHARED_DATA_CONFIGS.get(ITEM_PLOT_DATA_SOURCE_KEY)
df_item_plot_with_base_attributes = pd.DataFrame()
item_plot_global_tm_min, item_plot_global_tm_max = 0.0, 1.0
if not item_plot_current_data_config_dict: logger.error(f"Config for ITEM_PLOT_DATA_SOURCE_KEY '{ITEM_PLOT_DATA_SOURCE_KEY}' not found.")
else:
    mock_db_class_to_use = AppMockDBClassShared if SessionLocal is None else None
    df_full_item_plot = load_data_for_ternary(ITEM_PLOT_DATA_SOURCE_KEY, item_plot_current_data_config_dict, ITEM_PLOT_MODEL_ID_TO_ANALYZE, SessionLocal, engine, mock_db_class_to_use)
    if df_full_item_plot is None or df_full_item_plot.empty: logger.error(f"No data loaded for Item Plot (Source: {ITEM_PLOT_DATA_SOURCE_KEY}).")
    else:
        df_item_plot_with_base_attributes = calculate_base_ternary_attributes(df_full_item_plot.copy(), item_plot_current_data_config_dict)
        if ITEM_PLOT_ITEMS_TO_DISPLAY and not df_item_plot_with_base_attributes.empty:
            id_col_name = item_plot_current_data_config_dict.get('id_col')
            if id_col_name and id_col_name in df_item_plot_with_base_attributes.columns:
                initial_rows = len(df_item_plot_with_base_attributes)
                ids_to_check = ITEM_PLOT_ITEMS_TO_DISPLAY
                try:
                    if df_item_plot_with_base_attributes[id_col_name].notna().any():
                        if pd.api.types.is_numeric_dtype(df_item_plot_with_base_attributes[id_col_name].dropna()):
                            if any(isinstance(x, str) for x in ITEM_PLOT_ITEMS_TO_DISPLAY): ids_to_check = [str(x) for x in ITEM_PLOT_ITEMS_TO_DISPLAY]; df_item_plot_with_base_attributes[id_col_name] = df_item_plot_with_base_attributes[id_col_name].astype(str)
                            else: id_col_actual_type = type(df_item_plot_with_base_attributes[id_col_name].dropna().iloc[0]); ids_to_check = [id_col_actual_type(x) for x in ITEM_PLOT_ITEMS_TO_DISPLAY]
                        else:
                            ids_to_check = [str(x) for x in ITEM_PLOT_ITEMS_TO_DISPLAY]
                            if any(isinstance(x, str) for x in ids_to_check): df_item_plot_with_base_attributes[id_col_name] = df_item_plot_with_base_attributes[id_col_name].astype(str)
                except Exception as e_type_conv:
                    logger.warning(f"Type conversion for ITEM_PLOT_ITEMS_TO_DISPLAY failed: {e_type_conv}."); ids_to_check = [str(x) for x in ITEM_PLOT_ITEMS_TO_DISPLAY]
                    if id_col_name in df_item_plot_with_base_attributes.columns: df_item_plot_with_base_attributes[id_col_name] = df_item_plot_with_base_attributes[id_col_name].astype(str)
                df_item_plot_with_base_attributes = df_item_plot_with_base_attributes[df_item_plot_with_base_attributes[id_col_name].isin(ids_to_check)]
                if df_item_plot_with_base_attributes.empty and initial_rows > 0: logger.warning(f"No items matched ITEM_PLOT_ITEMS_TO_DISPLAY.")
        if not df_item_plot_with_base_attributes.empty and 'TotalMentions' in df_item_plot_with_base_attributes.columns and df_item_plot_with_base_attributes['TotalMentions'].notna().any():
            valid_mentions = pd.to_numeric(df_item_plot_with_base_attributes['TotalMentions'], errors='coerce').dropna()
            if not valid_mentions.empty:
                item_plot_global_tm_min, item_plot_global_tm_max = valid_mentions.min(), valid_mentions.max()
                if item_plot_global_tm_min == item_plot_global_tm_max: item_plot_global_tm_min = max(0, item_plot_global_tm_min - 0.5) if item_plot_global_tm_min is not None else 0.0; item_plot_global_tm_max = (item_plot_global_tm_max + 0.5) if item_plot_global_tm_max is not None else 1.0
        logger.info(f"Item Plot Global TotalMentions: min={item_plot_global_tm_min}, max={item_plot_global_tm_max}")

centroid_plot_current_data_config_dict = SHARED_DATA_CONFIGS.get(CENTROID_PLOT_DATA_SOURCE_KEY)
df_centroid_plot_base_items_loaded = pd.DataFrame()
df_country_ngram_weights_loaded = pd.DataFrame()
df_country_table_info_loaded = pd.DataFrame()
country_dropdown_options_for_centroid_plot = []
if not centroid_plot_current_data_config_dict: logger.error(f"Config for CENTROID_PLOT_DATA_SOURCE_KEY '{CENTROID_PLOT_DATA_SOURCE_KEY}' not found.")
else:
    mock_db_class_to_use = AppMockDBClassShared if SessionLocal is None else None
    _df_full_centroid_plot = load_data_for_ternary(CENTROID_PLOT_DATA_SOURCE_KEY, centroid_plot_current_data_config_dict, CENTROID_PLOT_MODEL_ID_TO_ANALYZE, SessionLocal, engine, mock_db_class_to_use)
    if _df_full_centroid_plot is None or _df_full_centroid_plot.empty: logger.error(f"No data loaded for Centroid Plot (Source: {CENTROID_PLOT_DATA_SOURCE_KEY}).")
    else: df_centroid_plot_base_items_loaded = _df_full_centroid_plot.copy()
    if engine is not None:
        try:
            item_id_col_for_sql = centroid_plot_current_data_config_dict.get('id_col', 'ngram_id')
            sql_view_item_id_col_name = 'ngram_id' if CENTROID_PLOT_DATA_SOURCE_KEY == 'ngrams' else item_id_col_for_sql
            sql_query_country_weights = f"SELECT country_speaker, \"{sql_view_item_id_col_name}\" AS \"{item_id_col_for_sql}\", count_sentences_for_ngram_by_country FROM vw_country_ngram_sentence_counts"
            df_country_ngram_weights_loaded = pd.read_sql_query(sql_query_country_weights, engine)
            sql_query_country_info = "SELECT id, merge_name, cpm_community_after_10_CPM_0_53 FROM country"
            df_country_table_info_loaded = pd.read_sql_query(sql_query_country_info, engine)
            logger.info(f"Centroid Plot: Loaded {len(df_country_ngram_weights_loaded)} country weights, {len(df_country_table_info_loaded)} country info.")
            if not df_country_table_info_loaded.empty and 'id' in df_country_table_info_loaded.columns and 'merge_name' in df_country_table_info_loaded.columns and not df_country_ngram_weights_loaded.empty:
                
                if 'country_speaker' in df_country_ngram_weights_loaded.columns and 'count_sentences_for_ngram_by_country' in df_country_ngram_weights_loaded.columns:
                    country_total_mentions = df_country_ngram_weights_loaded.groupby('country_speaker')['count_sentences_for_ngram_by_country'].sum().reset_index()
                    country_total_mentions.rename(columns={'country_speaker': 'id', 'count_sentences_for_ngram_by_country': 'total_mentions_for_country'}, inplace=True)
                    
                    temp_country_info_for_dropdown = pd.merge(
                        df_country_table_info_loaded.dropna(subset=['id', 'merge_name']),
                        country_total_mentions,
                        on='id',
                        how='left' 
                    )
                    temp_country_info_for_dropdown['total_mentions_for_country'].fillna(0, inplace=True)
                    temp_country_info_for_dropdown.sort_values(by='merge_name', inplace=True)

                    country_dropdown_options_for_centroid_plot = [
                        {'label': row['merge_name'], 'value': row['id'], 'disabled': row['total_mentions_for_country'] < 1}
                        for index, row in temp_country_info_for_dropdown.iterrows()
                    ]
                    logger.info(f"Created {len(country_dropdown_options_for_centroid_plot)} country dropdown options with disabled status.")
                else:
                    logger.warning("Required columns for country total mentions missing in df_country_ngram_weights_loaded. Cannot set disabled status for dropdown.")
                    if not df_country_table_info_loaded.empty and 'id' in df_country_table_info_loaded.columns and 'merge_name' in df_country_table_info_loaded.columns:
                        temp_country_info = df_country_table_info_loaded.dropna(subset=['id', 'merge_name']).sort_values(by='merge_name')
                        country_dropdown_options_for_centroid_plot = [{'label': row['merge_name'], 'value': row['id']} for index, row in temp_country_info.iterrows()]

            else: logger.warning("Country info table empty or missing key columns for dropdown.")
        except Exception as e: logger.error(f"Centroid Plot: Failed to pre-load country data/create dropdown: {e}", exc_info=True)

# --- APP INITIALIZATION ---
# Use a variable for url_base_pathname for clarity
URL_BASE_PATHNAME = os.getenv('URL_BASE_PATHNAME', '/')
if not URL_BASE_PATHNAME.endswith('/'):
    URL_BASE_PATHNAME += '/'
if URL_BASE_PATHNAME == '//': # Handle case where it might have been just '/'
    URL_BASE_PATHNAME = '/'

app = Dash(__name__, external_stylesheets=['https://codepen.io/chriddyp/pen/bWLwgP.css'], url_base_pathname=URL_BASE_PATHNAME, suppress_callback_exceptions=True)
server = app.server

# --- APP LAYOUT ---
# Construct link hrefs carefully based on URL_BASE_PATHNAME
item_plot_nav_link = f"{URL_BASE_PATHNAME.rstrip('/')}/item-plot"
centroid_plot_nav_link = f"{URL_BASE_PATHNAME.rstrip('/')}/centroid-plot"
# If base is just '/', ensure links don't start with '//'
if URL_BASE_PATHNAME == '/':
    item_plot_nav_link = "/item-plot"
    centroid_plot_nav_link = "/centroid-plot"

app.layout = html.Div([
    dcc.Location(id='url', refresh=False),
    html.Div([
        dcc.Link('Keyword View', href=item_plot_nav_link),
        html.Span(" | ", style={'paddingLeft': '10px', 'paddingRight': '10px'}),
        dcc.Link('Country View', href=centroid_plot_nav_link),
    ], style={'marginBottom': 20, 'padding': '10px', 'backgroundColor': '#f0f0f0', 'textAlign': 'center', 'borderBottom': '1px solid #ccc'}),
    html.Div(id='page-content', style={'padding': '20px'})
])

# --- REGISTER PAGE CALLBACKS ---
item_plot_page.register_callbacks(app, df_item_plot_with_base_attributes, item_plot_current_data_config_dict if item_plot_current_data_config_dict else {}, ITEM_PLOT_PAGE_SPECIFIC_CONFIGS, item_plot_global_tm_min, item_plot_global_tm_max)
centroid_plot_page.register_callbacks(app, df_centroid_plot_base_items_loaded, df_country_ngram_weights_loaded, df_country_table_info_loaded, centroid_plot_current_data_config_dict if centroid_plot_current_data_config_dict else {}, CENTROID_PLOT_PAGE_SPECIFIC_CONFIGS)


# --- MAIN ROUTING CALLBACK ---
@app.callback(Output('page-content', 'children'), [Input('url', 'pathname')])
def display_page(pathname):
    # Use the app's configured base pathname for routing logic
    # This should be the same as URL_BASE_PATHNAME used for app init.
    base_pathname_config = app.config.get('url_base_pathname', '/')
    if not base_pathname_config.endswith('/'):
        base_pathname_config += '/'
    if base_pathname_config == '//':
        base_pathname_config = '/'
    
    # Normalize the incoming pathname
    normalized_pathname = pathname
    if normalized_pathname is None:
        normalized_pathname = '/' # Default to root if None
    if not normalized_pathname.endswith('/'):
        # Add trailing slash unless it's the exact base path (without slash) and base is not just '/'
        if not (normalized_pathname == base_pathname_config.rstrip('/') and base_pathname_config != '/'):
             normalized_pathname += '/'
    if normalized_pathname == '//': # Clean up if it became '//'
        normalized_pathname = '/'

    logger.info(f"Routing: Raw Path='{pathname}', Normalized Path='{normalized_pathname}', Configured Base='{base_pathname_config}'")

    # Define routes relative to the base_pathname_config
    # These should end with a slash for consistent matching
    item_plot_rel_route = "item-plot/"
    centroid_plot_rel_route = "centroid-plot/"

    # Construct full paths for comparison based on configured base
    # Use rstrip('/') + '/' to ensure single trailing slash, then add relative route
    path_prefix = base_pathname_config.rstrip('/')
    if path_prefix == '': # if base_pathname_config was '/'
        full_item_plot_target_path = f"/{item_plot_rel_route}"
        full_centroid_plot_target_path = f"/{centroid_plot_rel_route}"
    else:
        full_item_plot_target_path = f"{path_prefix}/{item_plot_rel_route}"
        full_centroid_plot_target_path = f"{path_prefix}/{centroid_plot_rel_route}"
    
    # Links for welcome page (no trailing slash for display)
    link_item_plot = full_item_plot_target_path.rstrip('/')
    link_centroid_plot = full_centroid_plot_target_path.rstrip('/')


    if normalized_pathname == full_item_plot_target_path:
        return item_plot_page.layout(
            df_item_plot_with_base_attributes, 
            item_plot_current_data_config_dict if item_plot_current_data_config_dict else {}, 
            ITEM_PLOT_PAGE_SPECIFIC_CONFIGS, 
            item_plot_global_tm_min, 
            item_plot_global_tm_max
        )
    elif normalized_pathname == full_centroid_plot_target_path:
        return centroid_plot_page.layout(
            initial_amplification_power=CENTROID_PLOT_PAGE_SPECIFIC_CONFIGS.get('AMPLIFICATION_POWER_DEFAULT', 2.0),
            country_dropdown_options=country_dropdown_options_for_centroid_plot,
            app_specific_data_config=centroid_plot_current_data_config_dict if centroid_plot_current_data_config_dict else {},
            page_specific_configs=CENTROID_PLOT_PAGE_SPECIFIC_CONFIGS
        )
    elif normalized_pathname == base_pathname_config:
        welcome_title = "UN Transcript Analysis Tool"
        welcome_subtitle = "OEWG on security of and in the use of ICTs"
        welcome_instruction = "Select a tool to use from the navigation bar above."
        
        return html.Div([
            html.H2(welcome_title, style={'textAlign': 'center'}),
            html.H4(welcome_subtitle, style={'textAlign': 'center', 'fontStyle': 'italic', 'color': '#555'}),
            html.Br(),
            html.P(welcome_instruction, style={'textAlign': 'center'}),
            html.Br(),
            html.Div([
                dcc.Link('Keyword View', href=link_item_plot),
                html.Br(),
                html.Br(),
                dcc.Link('Country View', href=link_centroid_plot)
            ], style={'textAlign': 'center'})
        ], style={'padding': '20px', 'marginTop': '50px'})
    else:
        logger.warning(f"404: Pathname '{pathname}' (normalized to '{normalized_pathname}') not recognised. Target paths: Item='{full_item_plot_target_path}', Centroid='{full_centroid_plot_target_path}', Base='{base_pathname_config}'.")
        return html.Div([
            html.H1('404 - Page Not Found'),
            html.P(f"The page for pathname '{pathname}' was not found."),
            html.P(f"Please check the URL or select a tool from the navigation bar."),
            dcc.Link("Go to Homepage", href=base_pathname_config.rstrip('/'))
        ], style={'textAlign': 'center', 'color': 'red', 'marginTop': '50px'})

# --- LOCAL DEVELOPMENT SERVER RUNNER ---
if __name__ == '__main__':
    my_port = int(os.getenv("PORT", 8052))
    # Use the app's configured base pathname for startup messages
    actual_url_base_pathname_for_startup = app.config.get('url_base_pathname', '/')
    # Ensure it's clean for display (e.g. single slash if root, or /appbase/)
    if not actual_url_base_pathname_for_startup.endswith('/'):
        actual_url_base_pathname_for_startup += '/'
    if actual_url_base_pathname_for_startup == '//':
        actual_url_base_pathname_for_startup = '/'
        
    logger.info(f"Starting Multi-Page Dash app. Base URL: http://localhost:{my_port}{actual_url_base_pathname_for_startup.rstrip('/')}")
    print(f"Dash app (Multi-Page) on 0.0.0.0:{my_port}. URLs:")
    
    _item_href_startup = f"{actual_url_base_pathname_for_startup.rstrip('/')}/item-plot"
    _centroid_href_startup = f"{actual_url_base_pathname_for_startup.rstrip('/')}/centroid-plot"
    if actual_url_base_pathname_for_startup == '/': # Avoid double slash for root
        _item_href_startup = "/item-plot"
        _centroid_href_startup = "/centroid-plot"
        
    print(f"  Keyword View: http://localhost:{my_port}{_item_href_startup}")
    print(f"  Country View: http://localhost:{my_port}{_centroid_href_startup}")
    
    if actual_url_base_pathname_for_startup != '/':
        print(f"  Homepage: http://localhost:{my_port}{actual_url_base_pathname_for_startup.rstrip('/')}")
    else:
        print(f"  Homepage: http://localhost:{my_port}/")
        
    print(f"Using url_base_pathname for app: {app.config.get('url_base_pathname', '/')}. Press CTRL+C to quit.")
    app.run(debug=True, host='0.0.0.0', port=my_port)