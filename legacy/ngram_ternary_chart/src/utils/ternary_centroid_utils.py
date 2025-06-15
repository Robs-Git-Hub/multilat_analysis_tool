# src/utils/ternary_centroid_utils.py

import pandas as pd
import numpy as np
import logging

logger = logging.getLogger(__name__)

def calculate_amplified_ternary_coordinates(
    df_with_p_values: pd.DataFrame, 
    amplification_power: float
) -> pd.DataFrame:
    """
    Calculates amplified ternary coordinates (P_US_amp, P_Russia_amp, P_Middle_amp)
    from existing P_US, P_Russia, P_Middle coordinates.

    Args:
        df_with_p_values: DataFrame containing 'P_US', 'P_Russia', 'P_Middle' columns.
                          These columns should contain proportions (0 to 1).
        amplification_power: The power to which an item's affinity for each pole 
                             is raised before re-normalization.

    Returns:
        DataFrame with added/updated columns: 'P_US_amp', 'P_Russia_amp', 
        'P_Middle_amp', along with all original columns.
    """
    logger.info(f"Calculating amplified ternary coordinates with power {amplification_power}...")
    df_amp = df_with_p_values.copy()
    
    required_p_cols = ['P_US', 'P_Russia', 'P_Middle']
    output_amp_cols = ['P_US_amp', 'P_Russia_amp', 'P_Middle_amp']

    if not all(col in df_amp.columns for col in required_p_cols):
        logger.error("Missing one or more required P-value columns (P_US, P_Russia, P_Middle) for amplification.")
        # Add empty amplified columns if not present, to ensure consistent output schema
        for amp_col in output_amp_cols:
            if amp_col not in df_amp.columns:
                df_amp[amp_col] = np.nan
        return df_amp

    # Ensure P-value columns are numeric, coercing errors to NaN
    for p_col in required_p_cols:
        df_amp[p_col] = pd.to_numeric(df_amp[p_col], errors='coerce')

    # Separate rows with valid P-values from those with NaNs to handle them differently
    df_valid_p = df_amp.dropna(subset=required_p_cols).copy()
    df_invalid_p = df_amp[df_amp[required_p_cols].isna().any(axis=1)].copy()

    if not df_valid_p.empty:
        # Calculate primed (powered) P-values
        df_valid_p['P_US_prime'] = df_valid_p['P_US'] ** amplification_power
        df_valid_p['P_Russia_prime'] = df_valid_p['P_Russia'] ** amplification_power
        df_valid_p['P_Middle_prime'] = df_valid_p['P_Middle'] ** amplification_power
        
        # Sum of primed P-values for normalization
        df_valid_p['P_sum_prime'] = df_valid_p[['P_US_prime', 'P_Russia_prime', 'P_Middle_prime']].sum(axis=1)
        
        # Mask for valid sums (P_sum_prime > 0) to avoid division by zero
        valid_sum_mask = df_valid_p['P_sum_prime'] > 1e-9 # Using a small epsilon for float comparison

        # Calculate amplified coordinates
        for p_orig, p_prime, p_amp in zip(required_p_cols, 
                                          ['P_US_prime', 'P_Russia_prime', 'P_Middle_prime'], 
                                          output_amp_cols):
            df_valid_p[p_amp] = np.nan # Initialize column
            # Normalize where sum is valid
            df_valid_p.loc[valid_sum_mask, p_amp] = df_valid_p.loc[valid_sum_mask, p_prime] / df_valid_p.loc[valid_sum_mask, 'P_sum_prime']
            # Fallback: if sum_prime is zero (e.g., all P_X were 0), use original P_X values (which should also be 0 or near 0)
            # or set to 1/3, 1/3, 1/3 if all P_X were 0 and power > 0.
            # Current logic: if P_sum_prime is 0, amplified P will be NaN. If P_X were [0,0,0], P_X_prime are [0,0,0], sum_prime=0.
            # Fallback to original values if sum is zero, which is safer.
            df_valid_p.loc[~valid_sum_mask, p_amp] = df_valid_p.loc[~valid_sum_mask, p_orig]

        # Clean up temporary columns
        df_valid_p.drop(columns=['P_US_prime', 'P_Russia_prime', 'P_Middle_prime', 'P_sum_prime'], inplace=True, errors='ignore')
    else: # df_valid_p is empty
        logger.info("No rows with valid P-values found for amplification.")
        for amp_col in output_amp_cols:
            if amp_col not in df_valid_p.columns: # Should not happen if df_valid_p is truly empty
                 df_valid_p[amp_col] = pd.Series(dtype=float)


    # Ensure df_invalid_p has the amplified columns (filled with NaN)
    for amp_col in output_amp_cols:
        if amp_col not in df_invalid_p.columns:
            df_invalid_p[amp_col] = np.nan
            
    # Concatenate valid and invalid rows, then sort by index to restore original order
    df_final_amp = pd.concat([df_valid_p, df_invalid_p]).sort_index()
    logger.info(f"Finished calculating amplified coordinates. Output shape: {df_final_amp.shape}")
    return df_final_amp


def calculate_weighted_group_centroids(
    df_items: pd.DataFrame, 
    group_definitions: dict,
    coord_us_col: str = 'P_US_amp', 
    coord_russia_col: str = 'P_Russia_amp', 
    coord_middle_col: str = 'P_Middle_amp'
) -> pd.DataFrame:
    """
    Calculates weighted centroids for specified groups of items.

    Args:
        df_items: DataFrame containing item data, including coordinate columns 
                  (e.g., 'P_US_amp') and weight columns.
        group_definitions: Dictionary defining the groups. Example:
            {
                "GroupName1": {
                    "weight_col_name": "actual_weight_col_for_group1", 
                    "label": "Label for Group 1 Centroid",
                    "marker_symbol": "diamond", 
                    "marker_color": "blue"
                }, ...
            }
        coord_us_col: Name of the column for US-like coordinates.
        coord_russia_col: Name of the column for Russia-like coordinates.
        coord_middle_col: Name of the column for Middle-ground coordinates.

    Returns:
        DataFrame with centroid data: 'centroid_group_name', 'P_US_centroid', 
        'P_Russia_centroid', 'P_Middle_centroid', 'label', 'marker_symbol', 
        'marker_color', 'total_weight_for_group'.
    """
    logger.info("Calculating weighted group centroids...")
    centroids_data = []
    
    coordinate_cols = [coord_us_col, coord_russia_col, coord_middle_col]
    if not all(c in df_items.columns for c in coordinate_cols):
        logger.error(f"One or more coordinate columns ({coordinate_cols}) not found in df_items.")
        return pd.DataFrame()

    for group_name, definition in group_definitions.items():
        weight_col_name = definition.get('weight_col_name')
        if not weight_col_name:
            logger.warning(f"'weight_col_name' not defined for group '{group_name}'. Skipping centroid.")
            continue
        if weight_col_name not in df_items.columns:
            logger.warning(f"Weight column '{weight_col_name}' not found in df_items for group '{group_name}'. Skipping centroid.")
            continue

        df_group_calc = df_items.copy()
        # Ensure weight column is numeric, non-negative, and NaNs are 0
        df_group_calc[weight_col_name] = pd.to_numeric(df_group_calc[weight_col_name], errors='coerce').fillna(0).clip(lower=0)
        
        # Filter for items with valid coordinates and positive weight for this group
        valid_items_mask = (df_group_calc[weight_col_name] > 0) & \
                           (df_group_calc[coordinate_cols].notna().all(axis=1))
        
        valid_items_for_centroid = df_group_calc[valid_items_mask]
        
        if valid_items_for_centroid.empty:
            logger.warning(f"No valid items with positive weight for group '{group_name}'. Centroid set to geometric center (1/3,1/3,1/3).")
            centroid_coords = np.array([1/3, 1/3, 1/3])
            total_weight_for_group = 0.0
        else:
            current_weights = valid_items_for_centroid[weight_col_name]
            coords_to_average = valid_items_for_centroid[coordinate_cols].values
            
            if current_weights.sum() == 0: # Should be caught by weight_col_name > 0, but as a safeguard
                logger.warning(f"Total weight is zero for group '{group_name}' despite valid items. Centroid set to geometric center.")
                centroid_coords = np.array([1/3, 1/3, 1/3])
                total_weight_for_group = 0.0
            else:
                try:
                    centroid_coords = np.average(coords_to_average, weights=current_weights, axis=0)
                    total_weight_for_group = current_weights.sum()
                except ZeroDivisionError: # Should not happen if current_weights.sum() > 0
                     logger.error(f"Unexpected ZeroDivisionError for group '{group_name}'. Setting to geometric center.")
                     centroid_coords = np.array([1/3, 1/3, 1/3]); total_weight_for_group = 0.0
        
        centroids_data.append({
            'centroid_group_name': group_name,
            'P_US_centroid': centroid_coords[0], 
            'P_Russia_centroid': centroid_coords[1], 
            'P_Middle_centroid': centroid_coords[2],
            'label': definition.get('label', group_name),
            'marker_symbol': definition.get('marker_symbol', 'diamond'),
            'marker_color': definition.get('marker_color', 'grey'),
            'total_weight_for_group': total_weight_for_group
        })
        
    df_centroids = pd.DataFrame(centroids_data)
    logger.info(f"Finished calculating {len(df_centroids)} weighted group centroids.")
    return df_centroids


def calculate_categorical_item_centroids(
    df_items_with_coords: pd.DataFrame, 
    df_category_weights: pd.DataFrame, 
    item_id_col: str, 
    category_col_in_weights: str, 
    category_weight_col: str, 
    coord_us_col: str = 'P_US_amp', 
    coord_russia_col: str = 'P_Russia_amp', 
    coord_middle_col: str = 'P_Middle_amp',
    categories_to_process: list = None,
    centroid_label_prefix: str = "Centroid: ",
    default_marker_symbol: str = "circle",
    default_marker_color: str = "purple" # Default color, can be overridden by assign_colors_to_centroids
) -> pd.DataFrame:
    """
    Calculates weighted centroids for items, grouped by a specified category 
    (e.g., country-specific centroids for ngrams/topics).

    Args:
        df_items_with_coords: DataFrame with item IDs and their coordinates.
        df_category_weights: DataFrame with item IDs, category identifiers, and weights.
        item_id_col: Name of the ID column linking the two DataFrames.
        category_col_in_weights: Column in df_category_weights holding category names.
        category_weight_col: Column in df_category_weights holding weights.
        coord_us_col, coord_russia_col, coord_middle_col: Coordinate column names.
        categories_to_process: Optional list of specific categories to calculate for.
        centroid_label_prefix: Prefix for the 'label' column in the output.
        default_marker_symbol: Default symbol for markers.
        default_marker_color: Default color for markers.

    Returns:
        DataFrame of centroids: [category_col_in_weights], 'P_US_centroid', 
        'P_Russia_centroid', 'P_Middle_centroid', 'label', 'marker_symbol', 
        'marker_color', 'total_weight_for_group'.
    """
    logger.info(f"Calculating categorical item centroids for category '{category_col_in_weights}'...")
    coordinate_cols = [coord_us_col, coord_russia_col, coord_middle_col]

    # Validate inputs
    if df_items_with_coords.empty or item_id_col not in df_items_with_coords.columns:
        logger.error(f"df_items_with_coords is empty or missing item_id_col '{item_id_col}'.")
        return pd.DataFrame()
    if not all(c in df_items_with_coords.columns for c in coordinate_cols):
        logger.error(f"Missing one or more coordinate columns ({coordinate_cols}) in df_items_with_coords.")
        return pd.DataFrame()
    if df_category_weights.empty:
        logger.warning("df_category_weights is empty. No centroids will be calculated.")
        return pd.DataFrame()
    for col_check in [item_id_col, category_col_in_weights, category_weight_col]:
        if col_check not in df_category_weights.columns:
            logger.error(f"Required column '{col_check}' missing in df_category_weights.")
            return pd.DataFrame()

    # Prepare DataFrames for merging
    df_items_copy = df_items_with_coords[[item_id_col] + coordinate_cols].copy()
    df_weights_copy = df_category_weights[[item_id_col, category_col_in_weights, category_weight_col]].copy()

    # Ensure consistent dtypes for merge key
    try:
        if df_items_copy[item_id_col].dtype != df_weights_copy[item_id_col].dtype:
            logger.info(f"Attempting to align dtype of '{item_id_col}' for merge between items and weights.")
            # Prefer converting to string if one is object/string, otherwise attempt to match types
            if df_weights_copy[item_id_col].dtype == object or \
               str(df_weights_copy[item_id_col].dtype).startswith('string') or \
               df_items_copy[item_id_col].dtype == object or \
               str(df_items_copy[item_id_col].dtype).startswith('string'):
                df_items_copy[item_id_col] = df_items_copy[item_id_col].astype(str)
                df_weights_copy[item_id_col] = df_weights_copy[item_id_col].astype(str)
            else: # If both are numeric but different types (e.g. int64 vs int32)
                 df_items_copy[item_id_col] = df_items_copy[item_id_col].astype(df_weights_copy[item_id_col].dtype)
    except Exception as e:
        logger.warning(f"Could not ensure '{item_id_col}' types match for merge: {e}. Proceeding with merge.")

    df_merged = pd.merge(df_items_copy, df_weights_copy, on=item_id_col, how='inner')
    if df_merged.empty:
        logger.warning(f"No common items found after merging items with category weights on '{item_id_col}'.")
        return pd.DataFrame()

    centroids_list = []
    unique_categories = df_merged[category_col_in_weights].unique()
    
    categories_for_calc = unique_categories
    if categories_to_process is not None: # Filter by user-provided list
        categories_for_calc = [c for c in categories_to_process if c in unique_categories]
        if not categories_for_calc:
            logger.info(f"None of the specified 'categories_to_process' found in the data.")
            return pd.DataFrame()

    for category_value in categories_for_calc:
        df_cat_subset = df_merged[df_merged[category_col_in_weights] == category_value].copy()
        
        # Ensure weights are numeric, non-negative, NaNs are 0
        df_cat_subset['weights_numeric'] = pd.to_numeric(df_cat_subset[category_weight_col], errors='coerce').fillna(0).clip(lower=0)
        
        valid_items_mask = (df_cat_subset['weights_numeric'] > 0) & \
                           (df_cat_subset[coordinate_cols].notna().all(axis=1))
        
        valid_items_for_centroid = df_cat_subset[valid_items_mask]
        current_weights = valid_items_for_centroid['weights_numeric']
        
        if valid_items_for_centroid.empty or current_weights.sum() == 0:
            logger.warning(f"No valid items or zero total weight for category '{category_value}'. Centroid set to geometric center.")
            centroid_coords = np.array([1/3, 1/3, 1/3])
            total_weight = 0.0
        else:
            coords_to_average = valid_items_for_centroid[coordinate_cols].values
            centroid_coords = np.average(coords_to_average, weights=current_weights, axis=0)
            total_weight = current_weights.sum()
            
        centroids_list.append({
            category_col_in_weights: category_value, # Use the actual category column name
            'P_US_centroid': centroid_coords[0],
            'P_Russia_centroid': centroid_coords[1],
            'P_Middle_centroid': centroid_coords[2],
            'label': f"{centroid_label_prefix}{category_value}",
            'marker_symbol': default_marker_symbol,
            'marker_color': default_marker_color, # This is a default, can be changed by assign_colors
            'total_weight_for_group': total_weight
        })
        
    df_centroids = pd.DataFrame(centroids_list)
    logger.info(f"Finished calculating {len(df_centroids)} categorical item centroids.")
    return df_centroids


def assign_colors_to_centroids(
    df_centroids: pd.DataFrame, 
    df_category_info: pd.DataFrame, 
    centroid_category_col: str, 
    info_category_id_col: str, 
    info_grouping_col: str, 
    color_map: dict,
    default_color_key: str = 'DEFAULT',
    output_color_col_name: str = 'marker_color_final'
) -> pd.DataFrame:
    """
    Assigns colors to centroids based on category information and a color map.
    The function also ensures that the `info_grouping_col` used for coloring
    is present in the returned DataFrame.

    Args:
        df_centroids: DataFrame of centroids (e.g., output from 
                      calculate_categorical_item_centroids). It is expected to have
                      the `centroid_category_col`.
        df_category_info: DataFrame with category IDs and grouping info for coloring.
                          Expected to have `info_category_id_col` and `info_grouping_col`.
        centroid_category_col: Column name in `df_centroids` that identifies the category 
                               (e.g., country ID, topic ID). This column is used as the
                               left key for merging with `df_category_info`.
        info_category_id_col: Column name in `df_category_info` that contains the category
                              IDs corresponding to `centroid_category_col`. This column is
                              used as the right key for merging.
        info_grouping_col: Column name in `df_category_info` that contains the actual
                           values (e.g., community labels like 'A', 'G') to be mapped
                           to colors using `color_map`. This column will be included in
                           the output DataFrame.
        color_map: Dictionary mapping values from `info_grouping_col` to color strings
                   (e.g., {'A': 'blue', 'G': 'red'}).
        default_color_key: Key in `color_map` to use for a default color if a value from
                           `info_grouping_col` is not in `color_map` or if data is missing.
                           Alternatively, can be a literal color string (e.g., 'grey').
                           If a key, and the key is not in `color_map`, 'grey' is used.
        output_color_col_name: Name of the new column to be added to `df_centroids` that
                               will store the final assigned marker colors.

    Returns:
        DataFrame: A copy of the input `df_centroids` DataFrame with an added column
        for the assigned colors (named by `output_color_col_name`) and also ensuring
        the presence of the `info_grouping_col` (with values obtained from the merge
        with `df_category_info`). If `info_grouping_col` was already present in
        `df_centroids`, its values might be updated based on the merge.
    """
    if df_centroids.empty:
        logger.info("Input df_centroids is empty. Returning as is.")
        # Ensure expected output columns exist even for an empty DataFrame
        if output_color_col_name not in df_centroids.columns:
             df_centroids[output_color_col_name] = pd.Series(dtype=str)
        if info_grouping_col not in df_centroids.columns: # Ensure info_grouping_col also exists
             df_centroids[info_grouping_col] = pd.Series(dtype=object) # Or appropriate dtype
        return df_centroids
    
    df_centroids_colored = df_centroids.copy()
    
    # Determine default color value early
    default_color_value = color_map.get(default_color_key, default_color_key if isinstance(default_color_key, str) else 'grey')

    if df_category_info.empty:
        logger.warning("df_category_info is empty. Using default color for all centroids and original/NaN for grouping column.")
        df_centroids_colored[output_color_col_name] = default_color_value
        # If info_grouping_col is not in df_centroids_colored, add it with NaNs or keep existing.
        if info_grouping_col not in df_centroids_colored.columns:
            df_centroids_colored[info_grouping_col] = pd.NA 
        return df_centroids_colored

    # Validate required columns in input DataFrames
    if centroid_category_col not in df_centroids_colored.columns:
        logger.error(f"centroid_category_col '{centroid_category_col}' not in df_centroids. Using default color.")
        df_centroids_colored[output_color_col_name] = default_color_value
        if info_grouping_col not in df_centroids_colored.columns:
            df_centroids_colored[info_grouping_col] = pd.NA
        return df_centroids_colored
        
    if info_category_id_col not in df_category_info.columns or \
       info_grouping_col not in df_category_info.columns:
        logger.error(f"df_category_info missing key columns: '{info_category_id_col}' or '{info_grouping_col}'. Using default color.")
        df_centroids_colored[output_color_col_name] = default_color_value
        if info_grouping_col not in df_centroids_colored.columns:
            df_centroids_colored[info_grouping_col] = pd.NA
        return df_centroids_colored

    # Select only necessary columns from df_category_info for the merge
    df_info_subset = df_category_info[[info_category_id_col, info_grouping_col]].copy()
    # Drop duplicates in df_info_subset based on info_category_id_col to avoid row multiplication during merge
    # Keep the first occurrence if duplicates exist.
    df_info_subset.drop_duplicates(subset=[info_category_id_col], keep='first', inplace=True)


    # Ensure consistent dtypes for merge key columns to prevent merge errors or empty merges
    try:
        if df_centroids_colored[centroid_category_col].dtype != df_info_subset[info_category_id_col].dtype:
            logger.info(f"Attempting to align dtype for merge key: '{centroid_category_col}' ({df_centroids_colored[centroid_category_col].dtype}) and '{info_category_id_col}' ({df_info_subset[info_category_id_col].dtype}).")
            # Prefer converting to string if there's a mix or object types involved
            if df_centroids_colored[centroid_category_col].dtype == object or \
               str(df_centroids_colored[centroid_category_col].dtype).startswith('string') or \
               df_info_subset[info_category_id_col].dtype == object or \
               str(df_info_subset[info_category_id_col].dtype).startswith('string'):
                df_centroids_colored[centroid_category_col] = df_centroids_colored[centroid_category_col].astype(str)
                df_info_subset[info_category_id_col] = df_info_subset[info_category_id_col].astype(str)
            elif pd.api.types.is_numeric_dtype(df_centroids_colored[centroid_category_col]) and \
                 pd.api.types.is_numeric_dtype(df_info_subset[info_category_id_col]):
                # If both are numeric but different (e.g., int64 and float64), this can be tricky.
                # Converting the right key to the left key's type is one approach.
                # However, direct conversion might lose precision or fail.
                # For robust numeric joins, often ensuring they are both float or both int is needed.
                # This part might need more sophisticated handling based on specific data.
                # For now, let's attempt converting right to left's type.
                logger.warning(f"Numeric dtypes differ for merge keys. Attempting to cast '{info_category_id_col}' to dtype of '{centroid_category_col}'. This might be lossy.")
                df_info_subset[info_category_id_col] = df_info_subset[info_category_id_col].astype(df_centroids_colored[centroid_category_col].dtype)
            else:
                logger.warning(f"Unhandled dtype mismatch for merge keys: '{centroid_category_col}' ({df_centroids_colored[centroid_category_col].dtype}) and '{info_category_id_col}' ({df_info_subset[info_category_id_col].dtype}). Merge might fail or produce unexpected results.")

    except Exception as e:
        logger.warning(f"Could not align dtypes for color assignment merge: {e}. Proceeding with merge, but it may be affected.")
    
    # Perform the merge. This will bring info_grouping_col into df_centroids_merged.
    df_centroids_merged = pd.merge(
        df_centroids_colored, 
        df_info_subset, # Contains info_category_id_col and info_grouping_col
        left_on=centroid_category_col, 
        right_on=info_category_id_col, 
        how='left'
    )
    
    # Map grouping values from the merged info_grouping_col to colors
    # The info_grouping_col in df_centroids_merged will have come from df_info_subset
    df_centroids_merged[output_color_col_name] = df_centroids_merged[info_grouping_col].map(
        lambda x: color_map.get(x, default_color_value) if pd.notna(x) else default_color_value
    )
    
    # Fill any remaining NaNs in the color column (e.g., if info_grouping_col itself was NaN after merge)
    df_centroids_merged[output_color_col_name].fillna(default_color_value, inplace=True)
    
    # --- Ensure the output DataFrame (df_centroids_colored) has the new color column AND the grouping column ---
    
    # 1. Assign the newly created color column
    df_centroids_colored[output_color_col_name] = df_centroids_merged[output_color_col_name].values

    # 2. Ensure info_grouping_col is present and correctly populated from the merge.
    #    df_centroids_merged[info_grouping_col] contains the values from df_category_info.
    #    If info_grouping_col was already in df_centroids_colored, its values will be updated.
    #    If it wasn't, it will be added.
    if info_grouping_col in df_centroids_merged.columns:
        df_centroids_colored[info_grouping_col] = df_centroids_merged[info_grouping_col].values
    else:
        # This case should be rare if info_grouping_col is correctly specified and present in df_category_info.
        # It might occur if info_grouping_col has the same name as info_category_id_col and that column
        # was dropped or renamed by the merge due to name collision with centroid_category_col.
        # However, pandas merge typically appends _x, _y if not explicitly handled.
        # Given df_info_subset explicitly selects info_grouping_col, it should be there.
        logger.warning(f"Column '{info_grouping_col}' was unexpectedly not found in the merged DataFrame. "
                       f"The grouping column in the output might be missing or incorrect.")
        if info_grouping_col not in df_centroids_colored.columns: # If it wasn't even in the original
            df_centroids_colored[info_grouping_col] = pd.NA


    # If info_category_id_col was different from centroid_category_col, it would have been added
    # by the merge to df_centroids_merged. We don't want to keep it in df_centroids_colored
    # unless it was already there. df_centroids_colored is a copy of the original df_centroids,
    # so by assigning columns to it directly, we avoid adding extra unwanted columns like a
    # duplicated ID column from the merge.

    logger.info(f"Finished assigning colors to centroids. Output color column: '{output_color_col_name}'. Grouping column '{info_grouping_col}' also ensured in output.")
    return df_centroids_colored