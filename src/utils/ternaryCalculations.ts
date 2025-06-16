
// src/utils/ternaryCalculations.ts

// --- Type Definitions ---
// These interfaces act as a strict contract for our data structures.

/**
 * Represents a basic data item with its original ternary coordinates.
 * It can have other properties, which we allow with [key: string]: any.
 */
export interface TernaryDataItem {
  id: string | number;
  P_US: number | null | undefined;
  P_Russia: number | null | undefined;
  P_Middle: number | null | undefined;
  [key: string]: any; // Allows for other properties like weights
}

/**
 * Represents a data item after amplification.
 * It includes the original data plus the new amplified coordinates.
 */
export interface AmplifiedTernaryDataItem extends TernaryDataItem {
  P_US_amp: number;
  P_Russia_amp: number;
  P_Middle_amp: number;
}

/**
 * Defines a group for centroid calculation, specifying the column
 * that contains the weight for items in this group.
 */
export interface GroupDefinition {
  weight_col_name: string;
  label: string;
  marker_symbol?: string;
  marker_color?: string;
}

/**
 * Represents a calculated centroid point.
 */
export interface Centroid {
  centroid_group_name: string;
  P_US_centroid: number;
  P_Russia_centroid: number;
  P_Middle_centroid: number;
  total_weight_for_group: number;
  label: string;
  marker_symbol?: string;
  marker_color?: string;
  // Allow other properties for flexibility (e.g., category_id, group)
  [key: string]: any;
}

/**
 * Represents the weight of a specific item for a specific category.
 * Used for calculating categorical centroids.
 */
export interface CategoricalWeight {
  item_id: string | number;
  category_id: string | number;
  weight: number;
}

/**
 * Represents information about a category, such as its grouping.
 * Used for assigning colors or other properties to centroids.
 */
export interface CategoryInfo {
  id: string | number;
  group: string;
  [key: string]: any;
}


// --- Calculation Functions ---

/**
 * [CORRECTED] Calculates amplified ternary coordinates using generics.
 * This function now accepts an array of any type `T` that extends `TernaryDataItem`,
 * and it returns an array that includes all original properties of `T` plus the
 * new amplified coordinates. This preserves properties like `TotalMentions` and `size_px`
 * through the transformation, fixing the TypeScript errors.
 *
 * @param data - An array of items with P_US, P_Russia, P_Middle coordinates.
 * @param amplificationPower - The power to raise each coordinate to before re-normalizing.
 * @returns An array of items with added P_US_amp, P_Russia_amp, P_Middle_amp coordinates.
 */
export function calculateAmplifiedCoordinates<T extends TernaryDataItem>(
  data: T[],
  amplificationPower: number
): (T & { P_US_amp: number; P_Russia_amp: number; P_Middle_amp: number })[] {
  const amplifiedData: (T & { P_US_amp: number; P_Russia_amp: number; P_Middle_amp: number })[] = [];

  for (const item of data) {
    const { P_US, P_Russia, P_Middle } = item;

    // Only process items with valid, non-null coordinates
    if (P_US === null || P_US === undefined ||
        P_Russia === null || P_Russia === undefined ||
        P_Middle === null || P_Middle === undefined) {
      continue;
    }

    const p_us_prime = Math.pow(P_US, amplificationPower);
    const p_russia_prime = Math.pow(P_Russia, amplificationPower);
    const p_middle_prime = Math.pow(P_Middle, amplificationPower);

    const sum_prime = p_us_prime + p_russia_prime + p_middle_prime;

    // Handle the case where the sum is zero to avoid division by zero.
    if (sum_prime < 1e-9) {
      amplifiedData.push({
        ...item,
        P_US_amp: P_US,
        P_Russia_amp: P_Russia,
        P_Middle_amp: P_Middle,
      });
    } else {
      amplifiedData.push({
        ...item,
        P_US_amp: p_us_prime / sum_prime,
        P_Russia_amp: p_russia_prime / sum_prime,
        P_Middle_amp: p_middle_prime / sum_prime,
      });
    }
  }

  return amplifiedData;
}


/**
 * Calculates weighted centroids for pre-defined groups of items.
 * @param items - An array of amplified data items.
 * @param groupDefinitions - A dictionary defining groups and their weight columns.
 * @returns An array of calculated Centroid objects.
 */
export function calculateWeightedGroupCentroids(
  items: AmplifiedTernaryDataItem[],
  groupDefinitions: Record<string, GroupDefinition>
): Centroid[] {
  const centroids: Centroid[] = [];

  for (const groupName in groupDefinitions) {
    const definition = groupDefinitions[groupName];
    const weightCol = definition.weight_col_name;

    let totalWeight = 0;
    let weightedSumUS = 0;
    let weightedSumRussia = 0;
    let weightedSumMiddle = 0;

    for (const item of items) {
      const weight = (item[weightCol] as number) || 0;
      if (weight > 0) {
        totalWeight += weight;
        weightedSumUS += item.P_US_amp * weight;
        weightedSumRussia += item.P_Russia_amp * weight;
        weightedSumMiddle += item.P_Middle_amp * weight;
      }
    }

    let centroid: Centroid;
    if (totalWeight > 1e-9) {
      centroid = {
        centroid_group_name: groupName,
        P_US_centroid: weightedSumUS / totalWeight,
        P_Russia_centroid: weightedSumRussia / totalWeight,
        P_Middle_centroid: weightedSumMiddle / totalWeight,
        total_weight_for_group: totalWeight,
        label: definition.label,
        marker_symbol: definition.marker_symbol,
        marker_color: definition.marker_color,
      };
    } else {
      // If no items have weight, place centroid at the geometric center.
      centroid = {
        centroid_group_name: groupName,
        P_US_centroid: 1 / 3,
        P_Russia_centroid: 1 / 3,
        P_Middle_centroid: 1 / 3,
        total_weight_for_group: 0,
        label: definition.label,
        marker_symbol: definition.marker_symbol,
        marker_color: definition.marker_color,
      };
    }
    centroids.push(centroid);
  }

  return centroids;
}

/**
 * Calculates centroids for items grouped by a dynamic category.
 * @param items - An array of amplified data items.
 * @param categoryWeights - An array linking items to categories and their weights.
 * @param itemIdCol - The name of the ID column in the `items` array.
 * @param categoryIdCol - The name of the category column in `categoryWeights`.
 * @param weightCol - The name of the weight column in `categoryWeights`.
 * @returns An array of calculated Centroid objects, one for each category.
 */
export function calculateCategoricalCentroids(
  items: AmplifiedTernaryDataItem[],
  categoryWeights: CategoricalWeight[],
  itemIdCol: keyof AmplifiedTernaryDataItem,
  categoryIdCol: keyof CategoricalWeight,
  weightCol: keyof CategoricalWeight
): Centroid[] {
  const itemsById = new Map(items.map(item => [item[itemIdCol], item]));
  const categoryData: Record<string, {
    totalWeight: number;
    weightedSumUS: number;
    weightedSumRussia: number;
    weightedSumMiddle: number;
  }> = {};

  for (const cw of categoryWeights) {
    const item = itemsById.get(cw.item_id);
    const weight = cw[weightCol] as number;
    const category = cw[categoryIdCol] as string;

    if (item && weight > 0) {
      if (!categoryData[category]) {
        categoryData[category] = { totalWeight: 0, weightedSumUS: 0, weightedSumRussia: 0, weightedSumMiddle: 0 };
      }
      const cat = categoryData[category];
      cat.totalWeight += weight;
      cat.weightedSumUS += item.P_US_amp * weight;
      cat.weightedSumRussia += item.P_Russia_amp * weight;
      cat.weightedSumMiddle += item.P_Middle_amp * weight;
    }
  }

  const centroids: Centroid[] = [];
  for (const category in categoryData) {
    const cat = categoryData[category];
    centroids.push({
      centroid_group_name: category,
      [categoryIdCol]: category,
      P_US_centroid: cat.weightedSumUS / cat.totalWeight,
      P_Russia_centroid: cat.weightedSumRussia / cat.totalWeight,
      P_Middle_centroid: cat.weightedSumMiddle / cat.totalWeight,
      total_weight_for_group: cat.totalWeight,
      label: `Centroid: ${category}`,
    });
  }

  return centroids;
}

/**
 * Assigns colors to centroids based on category information.
 * @param centroids - An array of Centroid objects.
 * @param categoryInfo - An array of objects with category-to-group mappings.
 * @param centroidCategoryCol - The key in a centroid object that holds its category ID.
 * @param infoCategoryIdCol - The key in a category info object that holds its ID.
 * @param infoGroupingCol - The key in a category info object that holds the group name for coloring.
 * @param colorMap - A map from group names to color strings.
 * @returns A new array of centroids with `marker_color_final` and the grouping column added.
 */
export function assignColorsToCentroids(
  centroids: Centroid[],
  categoryInfo: CategoryInfo[],
  centroidCategoryCol: string,
  infoCategoryIdCol: keyof CategoryInfo,
  infoGroupingCol: keyof CategoryInfo,
  colorMap: Record<string, string>
): (Centroid & { group?: string; marker_color_final: string })[] {
  const infoMap = new Map(categoryInfo.map(info => [info[infoCategoryIdCol], info]));
  const defaultColor = colorMap['DEFAULT'] || 'grey';

  return centroids.map(centroid => {
    const categoryId = centroid[centroidCategoryCol];
    const info = infoMap.get(categoryId);
    const group = info ? (info[infoGroupingCol] as string) : undefined;
    const color = group ? colorMap[group] || defaultColor : defaultColor;

    return {
      ...centroid,
      group: group,
      marker_color_final: color,
    };
  });
}