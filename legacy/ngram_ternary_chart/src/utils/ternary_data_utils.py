# src/utils/ternary_data_utils.py
import pandas as pd
import numpy as np
import plotly.graph_objects as go
import logging

# Configure logging for the module if not already configured by the main script
# This allows the module to log independently if run, for example, during testing.
# However, in a Jupyter notebook, the root logger is usually configured by the notebook.
if not logging.getLogger().hasHandlers() or logging.getLogger().getEffectiveLevel() > logging.INFO:
    logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__) # Use a module-specific logger


def load_data_for_ternary(data_source_key, config, model_id_filter=None, SessionLocal=None, engine=None, MockDBClass=None):
    """
    Loads data from the database or generates mock data, focusing on columns needed for ternary plot.

    Args:
        data_source_key (str): Key to identify the data source in the config.
        config (dict): Configuration dictionary for the specific data source.
                       Expected keys: 'model_class', 'id_col', 'label_col',
                                      'us_count_col', 'russia_count_col', 'middle_count_col'.
                                      Optional: 'fps_col', 'pval_ag_col', 'extra_id_cols',
                                                'model_id_column_for_filter'.
        model_id_filter (any, optional): Value to filter the data by model ID. Defaults to None.
        SessionLocal (sqlalchemy.orm.sessionmaker, optional): SQLAlchemy sessionmaker.
                      Required if loading from a database. Defaults to None.
        engine (sqlalchemy.engine.Engine, optional): SQLAlchemy engine.
                Required if loading from a database. Defaults to None.
        MockDBClass (type, optional): A class to use for mocking database models if SessionLocal/engine is None.
                     If None, a basic internal Mock will be used.

    Returns:
        pandas.DataFrame: DataFrame containing the loaded data, or an empty DataFrame on error/no data.
    """
    model_class = config.get('model_class')
    id_col = config.get('id_col')
    label_col = config.get('label_col')
    us_count_col = config.get('us_count_col')
    russia_count_col = config.get('russia_count_col')
    middle_count_col = config.get('middle_count_col')
    fps_col = config.get('fps_col')
    pval_ag_col = config.get('pval_ag_col')

    if not all([model_class, id_col, label_col, us_count_col, russia_count_col, middle_count_col]):
        logger.error("Essential configuration keys (model_class, id_col, label_col, count_cols) missing in config.")
        return pd.DataFrame()

    logger.info(f"Attempting to load data for ternary plot from source '{data_source_key}' (table hint: '{getattr(model_class, '__tablename__', 'N/A')}')...")

    columns_to_fetch = list(set(filter(None, [
        id_col, label_col, us_count_col, russia_count_col, middle_count_col,
        fps_col, pval_ag_col
    ])))
    if config.get('extra_id_cols'):
        columns_to_fetch.extend(config['extra_id_cols'])
    columns_to_fetch = list(set(columns_to_fetch))

    if SessionLocal is None or engine is None:
        logger.warning("SessionLocal or engine is None. Generating mock data.")
        
        _MockDBClass_internal = None
        if MockDBClass is None:
            class InternalMockDBClass: # Define a basic mock if none provided
                __tablename__ = "internal_mock_table"
                def __init__(self, **kwargs):
                    for k,v in kwargs.items(): setattr(self, k, v)
            _MockDBClass_internal = InternalMockDBClass
        
        # Use the provided MockDBClass or the internal one
        current_mock_class = MockDBClass if MockDBClass is not None else _MockDBClass_internal

        mock_data_size = 20 # Reduced for quicker testing if mocked
        data = {
            id_col: range(mock_data_size) if id_col == 'topic_id' else [f"MockItem{i}" for i in range(mock_data_size)],
            label_col: [f"MockLabel{i}" for i in range(mock_data_size)],
            us_count_col: np.random.randint(0, 100, mock_data_size),
            russia_count_col: np.random.randint(0, 100, mock_data_size),
            middle_count_col: np.random.randint(0, 100, mock_data_size),
        }
        if fps_col: data[fps_col] = np.random.rand(mock_data_size)
        if pval_ag_col: data[pval_ag_col] = np.random.rand(mock_data_size)
        
        model_id_col_for_filter = config.get('model_id_column_for_filter')
        if model_id_col_for_filter and model_id_filter is not None:
             data[model_id_col_for_filter] = model_id_filter # All mock items belong to this model_id

        df = pd.DataFrame(data)
        # Ensure all columns expected to be fetched are present, even if with Nones/NAs
        for col_name in columns_to_fetch:
            if col_name not in df.columns:
                df[col_name] = pd.NA # Use pd.NA for missing values
        logger.info(f"Loaded {len(df)} mock rows. Columns: {df.columns.tolist()}")
        return df

    session = SessionLocal()
    try:
        query_cols_attr = []
        for col_name in columns_to_fetch:
            if not hasattr(model_class, col_name):
                # This could happen if model_class is a simple mock not fully mirroring the DB model
                # For a real DB model, this indicates a mismatch between config and schema.
                if model_class.__name__.startswith("Mock") or model_class.__name__ == "InternalMockDBClass":
                    logger.warning(f"Mock model '{model_class.__name__}' does not have attribute '{col_name}'. This might be okay for mocks.")
                    # Cannot add to query if attribute truly doesn't exist and it's not a mock attribute added at runtime
                    continue
                else:
                    raise ValueError(f"Column '{col_name}' not found in model '{model_class.__name__}'. Check DATA_CONFIGS.")
            query_cols_attr.append(getattr(model_class, col_name))
        
        if not query_cols_attr:
            logger.error("No valid columns found to query from the database model based on config.")
            return pd.DataFrame()

        query = session.query(*query_cols_attr)

        model_id_col_for_filter = config.get('model_id_column_for_filter')
        if model_id_filter is not None and model_id_col_for_filter:
            if hasattr(model_class, model_id_col_for_filter):
                query = query.filter(getattr(model_class, model_id_col_for_filter) == model_id_filter)
            else:
                logger.warning(f"Model ID filter column '{model_id_col_for_filter}' not present in {model_class.__name__}. Filter not applied.")

        df = pd.read_sql_query(query.statement, session.bind)
        logger.info(f"Loaded {len(df)} rows from '{getattr(model_class, '__tablename__', 'N/A')}'. Columns: {df.columns.tolist()}")
        return df
    except Exception as e:
        logger.error(f"Error loading data for ternary plot from database: {str(e)}", exc_info=True)
        return pd.DataFrame()
    finally:
        if session:
            session.close()


def calculate_base_ternary_attributes(df_input, config):
    """
    Calculates base ternary proportions (P_US, P_Russia, P_Middle) and TotalMentions.

    Args:
        df_input (pandas.DataFrame): DataFrame containing raw count columns.
                                     Expected to have columns specified in config for counts.
        config (dict): Configuration dictionary for the specific data source.
                       Expected keys: 'us_count_col', 'russia_count_col', 'middle_count_col', 'id_col'.

    Returns:
        pandas.DataFrame: DataFrame with added/updated columns:
                          'P_US', 'P_Russia', 'P_Middle', 'TotalMentions'.
                          Original DataFrame is copied and not modified in place.
    """
    if df_input is None or df_input.empty:
        logger.warning("Input DataFrame is empty. Cannot calculate base ternary attributes.")
        return pd.DataFrame()

    df = df_input.copy()

    us_col = config.get('us_count_col')
    rus_col = config.get('russia_count_col')
    mid_col = config.get('middle_count_col')
    # id_col = config.get('id_col') # Not strictly needed for this calculation but good for context

    if not all([us_col, rus_col, mid_col]):
        logger.error("Essential count column keys (us_count_col, russia_count_col, middle_count_col) missing in config.")
        # Add empty columns to return a consistently shaped (though invalid) DataFrame
        for p_col in ["P_US", "P_Russia", "P_Middle", "TotalMentions"]:
            if p_col not in df.columns: df[p_col] = pd.NA
        return df
        
    logger.info(f"Calculating base ternary attributes using count columns: US='{us_col}', Russia='{rus_col}', Middle='{mid_col}'.")

    count_cols_actual = [us_col, rus_col, mid_col]
    for col in count_cols_actual:
        if col not in df.columns:
            logger.warning(f"Required count column '{col}' not found in DataFrame. Initializing with zeros.")
            df[col] = 0
        # Ensure numeric, coerce errors to NaN, fill NaNs with 0, then clip at 0
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0).clip(lower=0)

    # Calculate TotalMentions first
    df["TotalMentions"] = df[count_cols_actual].sum(axis=1)

    # Calculate relative frequencies within each group (across all items)
    # r_X = count_X_for_item_i / sum(count_X_for_all_items)
    group_aliases_map = {'US': us_col, 'Russia': rus_col, 'Middle': mid_col}
    rel_freq_cols_temp = {} # To store temporary relative frequency column names

    for group_key, actual_col_name in group_aliases_map.items():
        total_for_group_overall = df[actual_col_name].sum()
        temp_rel_freq_col_name = f"_r_{group_key}" # Temporary column
        if total_for_group_overall > 0:
            df[temp_rel_freq_col_name] = df[actual_col_name] / total_for_group_overall
        else:
            df[temp_rel_freq_col_name] = 0.0
            logger.warning(f"Total sum for group '{group_key}' (column '{actual_col_name}') is 0. Its relative frequencies (r_{group_key}) will be 0.")
        rel_freq_cols_temp[group_key] = temp_rel_freq_col_name

    # Sum of these relative frequencies for each item: r_sum_for_item_i = r_US_i + r_Russia_i + r_Middle_i
    df["_r_sum_temp"] = df[list(rel_freq_cols_temp.values())].sum(axis=1)

    # Calculate P_X proportions for each item
    # P_X_for_item_i = r_X_i / r_sum_for_item_i
    # Initialize P_X columns with NA
    for p_col_key in ["P_US", "P_Russia", "P_Middle"]:
        df[p_col_key] = pd.NA

    # Calculate P_X only for rows where _r_sum_temp > 0 to avoid division by zero
    calculable_mask = df["_r_sum_temp"] > 1e-9 # Use a small epsilon for float comparison

    if calculable_mask.any():
        df.loc[calculable_mask, "P_US"]     = df.loc[calculable_mask, rel_freq_cols_temp['US']]     / df.loc[calculable_mask, "_r_sum_temp"]
        df.loc[calculable_mask, "P_Russia"] = df.loc[calculable_mask, rel_freq_cols_temp['Russia']] / df.loc[calculable_mask, "_r_sum_temp"]
        df.loc[calculable_mask, "P_Middle"] = df.loc[calculable_mask, rel_freq_cols_temp['Middle']] / df.loc[calculable_mask, "_r_sum_temp"]
    
    # For items where _r_sum_temp is 0 (e.g., item had 0 mentions in all three groups, or one group overall had 0 mentions)
    # P_X values will remain NA. This is generally correct.
    # If all three P_X are 0, they will sum to 0. If an item had some mentions but all r_X were 0 (e.g., due to group totals being 0),
    # then P_X will be NaN.

    # Clean up temporary columns
    df.drop(columns=list(rel_freq_cols_temp.values()) + ["_r_sum_temp"], inplace=True, errors='ignore')

    logger.info(f"Finished calculating base ternary attributes. {calculable_mask.sum()} items have valid P_X coordinates.")
    
    # Ensure P_X columns sum to 1 where not NA, or handle cases
    # Check for rows where P_X are calculated but don't sum to ~1 (float precision)
    # p_sum_check = df[["P_US", "P_Russia", "P_Middle"]].sum(axis=1)
    # problem_sum_rows = df[calculable_mask & (np.abs(p_sum_check - 1.0) > 1e-6)]
    # if not problem_sum_rows.empty:
    #     logger.warning(f"{len(problem_sum_rows)} rows have P_X values that do not sum to 1. Example problematic row index: {problem_sum_rows.index[0]}")
        
    return df

    #########
    # Functions for Step 30 (the Ngram ternary chart)
    #########

def recalculate_bubble_sizes(df_input: pd.DataFrame, 
                             min_bubble_size: int, 
                             max_bubble_size: int, 
                             scaling_power: float) -> pd.DataFrame:
    """
    Recalculates 'size_px' for the given df_input based on its 'TotalMentions'
    and the provided sizing parameters.
    """
    df = df_input.copy()

    if 'TotalMentions' not in df.columns:
        logging.warning("'TotalMentions' column not found in recalculate_bubble_sizes. Cannot calculate bubble sizes.")
        if 'size_px' not in df.columns: df['size_px'] = min_bubble_size
        return df
    if df.empty:
        if 'size_px' not in df.columns: 
            # Ensure size_px column exists with correct type even for empty df
            df['size_px'] = pd.Series(dtype=float if not df.empty else 'float64') 
        if df.empty: # If it was truly empty, can't assign a scalar like min_bubble_size directly to a column
             return df # Return empty df with potentially the size_px column
        # If not empty but became empty after some checks, assign min_bubble_size
        # This path seems unlikely given the 'if df.empty:' check above, but for robustness:
        if 'size_px' in df.columns and df.empty: # if size_px column was added but df is empty
            pass # do nothing, keep it as empty series
        elif 'size_px' not in df.columns: # if it's not empty but size_px is missing
             df['size_px'] = min_bubble_size

    # Ensure TotalMentions is numeric for sizing; items with NaN/non-numeric TotalMentions get min_bubble_size
    # and are treated as 0 for the purpose of partitioning.
    df["TotalMentions_numeric"] = pd.to_numeric(df["TotalMentions"], errors='coerce').fillna(0)

    items_for_sizing = df[df["TotalMentions_numeric"] > 0].copy()
    items_zero_mentions = df[~(df["TotalMentions_numeric"] > 0)].copy()

    if not items_for_sizing.empty:
        # Clip before log to avoid log(0) or log(negative) if TotalMentions_numeric somehow became <=0 after filter
        log_tot = np.log(items_for_sizing["TotalMentions_numeric"].clip(lower=1)) 
        scaled = log_tot ** scaling_power
        
        # Handle cases where scaled might be all same value or contain NaNs
        # which would make (scaled - scaled.min()) / (scaled.max() - scaled.min()) problematic (NaN or 0/0)
        min_scaled, max_scaled = scaled.min(), scaled.max()
        if pd.isna(min_scaled) or pd.isna(max_scaled) or min_scaled == max_scaled:
            # If all values are the same or issues with min/max, assign a mid-range normalized value or 0 if only one item
            scaled_norm = 0.5 if len(scaled) > 1 else 0.0 
        else:
            scaled_norm = (scaled - min_scaled) / (max_scaled - min_scaled)
        
        items_for_sizing["size_px"] = min_bubble_size + scaled_norm * (max_bubble_size - min_bubble_size)
    
    if not items_zero_mentions.empty:
        items_zero_mentions["size_px"] = min_bubble_size
    
    # Ensure 'size_px' column exists in all parts before concat, especially if one part is empty
    if 'size_px' not in items_for_sizing.columns and not items_for_sizing.empty: 
        items_for_sizing['size_px'] = min_bubble_size
    if 'size_px' not in items_zero_mentions.columns and not items_zero_mentions.empty: 
        items_zero_mentions['size_px'] = min_bubble_size
    
    # Concatenate the parts back together
    if not items_for_sizing.empty or not items_zero_mentions.empty:
        df_sized_parts = pd.concat([items_for_sizing, items_zero_mentions]).sort_index()
        if not df_sized_parts.empty and 'size_px' in df_sized_parts.columns:
            # Assign 'size_px' back to the original df structure, aligned by index
            df['size_px'] = df_sized_parts.reindex(df.index)['size_px']
        elif 'size_px' not in df.columns: # If df_sized_parts was empty or had no size_px
            df['size_px'] = min_bubble_size
    elif 'size_px' not in df.columns: # If both parts were empty initially
         df['size_px'] = min_bubble_size

    # Final fillna for 'size_px' in case some rows didn't get a size assigned (e.g., due to reindex issues with new rows)
    if 'size_px' in df.columns:
        df['size_px'].fillna(min_bubble_size, inplace=True)
    else: # Should not happen if logic above is correct, but as a fallback
        df['size_px'] = min_bubble_size

    return df.drop(columns=["TotalMentions_numeric"], errors='ignore')


def create_plotly_ternary_figure(
    df_plot: pd.DataFrame, 
    data_source_config: dict, 
    plot_layout_config: dict,
    global_tm_min: float = None, 
    global_tm_max: float = None
) -> go.Figure:
    """
    Creates a Plotly Graph Objects ternary figure for Dash.

    Args:
        df_plot: DataFrame containing the data to plot. Expected columns include
                 those specified in plot_layout_config['axis_mapping'] prop_col,
                 'size_px', 'hover_text', and 'TotalMentions'.
        data_source_config: Dictionary with data source specific configurations,
                            e.g., {'entity_type_label': 'Items'}.
        plot_layout_config: Dictionary with plot layout parameters:
            {
                'axis_mapping': {
                    'a_axis': {'prop_col': 'P_ColA', 'title': "Title A"},
                    'b_axis': {'prop_col': 'P_ColB', 'title': "Title B"},
                    'c_axis': {'prop_col': 'P_ColC', 'title': "Title C"},
                },
                'plot_title': "My Ternary Plot",
                'colorbar_title': "Total Mentions",
                'color_by_total_mentions': True,
                'color_scale_low': "#ff0000",
                'color_scale_high': "#00ff00"
            }
        global_tm_min: Optional minimum value for color scale normalization.
        global_tm_max: Optional maximum value for color scale normalization.
    """
    # Extract layout parameters from plot_layout_config
    axis_mapping = plot_layout_config.get('axis_mapping', {})
    plot_title_base = plot_layout_config.get('plot_title', "Ternary Plot")
    colorbar_title = plot_layout_config.get('colorbar_title', "Value")
    color_by_total_mentions = plot_layout_config.get('color_by_total_mentions', True)
    color_scale_low = plot_layout_config.get('color_scale_low', "#ffba00")
    color_scale_high = plot_layout_config.get('color_scale_high', "#6d6559")

    entity_type_label = data_source_config.get('entity_type_label', 'Items')
    full_plot_title = f"{plot_title_base} ({entity_type_label})"

    required_cols_map = {
        'a_axis_val': axis_mapping.get('a_axis', {}).get('prop_col'),
        'b_axis_val': axis_mapping.get('b_axis', {}).get('prop_col'),
        'c_axis_val': axis_mapping.get('c_axis', {}).get('prop_col'),
    }
    
    # Check for missing prop_col definitions
    if None in required_cols_map.values():
        logging.error(f"Plotting: One or more 'prop_col' definitions are missing in 'axis_mapping'. {axis_mapping}")
        # Create an empty figure with an error message
        fig = go.Figure()
        fig.add_annotation(text="Configuration error: Axis 'prop_col' missing.", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=16))
        fig.update_layout(title_text=full_plot_title, height=750, width=900)
        return fig

    other_required_cols = ['size_px', 'hover_text']
    if color_by_total_mentions:
        other_required_cols.append('TotalMentions')
        
    all_required_plotly_cols = list(required_cols_map.values()) + other_required_cols
    
    is_empty_or_invalid = df_plot.empty
    if not is_empty_or_invalid:
        for col in all_required_plotly_cols:
            if col not in df_plot.columns:
                is_empty_or_invalid = True
                logging.warning(f"Plotting: Required column '{col}' is missing in df_plot.")
                break
            if df_plot[col].isna().all():
                is_empty_or_invalid = True
                logging.warning(f"Plotting: Column '{col}' in df_plot contains only NaN values.")
                break
    
    if is_empty_or_invalid:
        logging.warning("Plotting: DataFrame is empty or missing critical data for plotting. Creating empty figure.")
        fig = go.Figure()
        fig.add_annotation(text="No data available for current filter/settings", xref="paper", yref="paper", x=0.5, y=0.5, showarrow=False, font=dict(size=16))
        # Basic ternary structure for empty plot
        ternary_layout_empty = dict(
            sum=1, 
            aaxis=dict(title=axis_mapping.get('a_axis', {}).get('title', 'A-axis'), min=0.0), 
            baxis=dict(title=axis_mapping.get('b_axis', {}).get('title', 'B-axis'), min=0.0), 
            caxis=dict(title=axis_mapping.get('c_axis', {}).get('title', 'C-axis'), min=0.0)
        )
        fig.update_layout(
            uirevision='initial_empty_view', 
            title_text=full_plot_title, 
            height=750, 
            width=900,
            ternary=ternary_layout_empty
        )
        return fig

    logging.info(f"Generating ternary plot figure for {len(df_plot)} items.")
    fig = go.Figure()
    
    hovertemplate = ("<b>%{text}</b><br><br>" +
                     f"{axis_mapping.get('a_axis',{}).get('title','A')}: %{{a:.3f}}<br>" +
                     f"{axis_mapping.get('b_axis',{}).get('title','B')}: %{{b:.3f}}<br>" +
                     f"{axis_mapping.get('c_axis',{}).get('title','C')}: %{{c:.3f}}<br>")
    if color_by_total_mentions and 'TotalMentions' in df_plot.columns:
        hovertemplate += f"{colorbar_title}: %{{customdata:.0f}}<extra></extra>"
    else:
        hovertemplate += "<extra></extra>"

    marker_config = dict(
        size=df_plot['size_px'], 
        sizemode='diameter', 
        sizeref=1.0, # Default, actual scaling can be managed by min/max sizes in recalculate_bubble_sizes
        # sizemin ensures that even if df_plot['size_px'] has very small values, they are at least 1px
        sizemin=max(1, pd.to_numeric(df_plot['size_px'], errors='coerce').min(skipna=True) if not df_plot['size_px'].empty and df_plot['size_px'].notna().any() else 1),
        line=dict(width=0.5, color='DarkSlateGrey')
    )

    if color_by_total_mentions and 'TotalMentions' in df_plot.columns and df_plot['TotalMentions'].notna().any():
        marker_config.update(dict(
            color=df_plot['TotalMentions'],
            colorscale=[color_scale_low, color_scale_high],
            cmin=global_tm_min, # Pass through, Plotly handles None as auto-ranging
            cmax=global_tm_max, # Pass through
            colorbar=dict(title=colorbar_title, thickness=20, len=0.7, x=1.05, y=0.5, yanchor="middle")
        ))

    fig.add_trace(go.Scatterternary(
        a=df_plot[required_cols_map['a_axis_val']], 
        b=df_plot[required_cols_map['b_axis_val']], 
        c=df_plot[required_cols_map['c_axis_val']],
        mode='markers',
        marker=marker_config,
        text=df_plot['hover_text'], 
        customdata=df_plot['TotalMentions'] if 'TotalMentions' in df_plot.columns else None, # Ensure customdata is present if referenced in hovertemplate
        hovertemplate=hovertemplate
    ))

    fig.update_layout(
        uirevision='constant_ternary_view', # Helps preserve zoom/pan across updates if only data changes
        height=750, 
        margin=dict(l=100, r=120, t=80, b=60), # Adjusted right margin for colorbar
        title=dict(text=full_plot_title, x=0.5, xanchor='center'), # Centered title
        ternary=dict(
            sum=1,
            aaxis=dict(title=dict(text=axis_mapping.get('a_axis',{}).get('title','A-axis'), font=dict(size=14)), linewidth=1.5, tickfont={'size': 10}, min=0.0),
            baxis=dict(title=dict(text=axis_mapping.get('b_axis',{}).get('title','B-axis'), font=dict(size=14)), linewidth=1.5, tickfont={'size': 10}, min=0.0),
            caxis=dict(title=dict(text=axis_mapping.get('c_axis',{}).get('title','C-axis'), font=dict(size=14)), linewidth=1.5, tickfont={'size': 10}, min=0.0),
            bgcolor="#f0f0f0" # Light grey background for the plot area
        ),
        hoverlabel=dict(bgcolor="white", font_size=12)
    )
    return fig