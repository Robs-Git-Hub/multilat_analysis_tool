
// src/utils/ternaryDataProcessing.ts

// --- Type Definitions ---

/**
 * Represents a basic data item with raw mention counts.
 */
export interface RawCountItem {
  id: string | number;
  // FIX: Make the index signature specific to our actual data types.
  // This prevents downstream errors by ensuring we only deal with primitives.
  [key: string]: string | number | null | undefined;
}

/**
 * Configuration for calculating base ternary attributes.
 * Specifies which columns hold the raw counts.
 */
export interface TernaryAttributesConfig {
  us_count_col: string;
  russia_count_col: string;
  middle_count_col: string;
}

/**
 * An item that has had its base ternary attributes calculated.
 * It includes the original data plus the new attributes.
 */
export interface ItemWithTernaryAttributes extends RawCountItem {
  TotalMentions: number;
  P_US: number;
  P_Russia: number;
  P_Middle: number;
}

/**
 * Configuration for calculating bubble sizes for the plot.
 */
export interface BubbleSizeConfig {
  minSize: number;
  maxSize: number;
  scalingPower: number;
}

/**
 * A final data item ready for plotting, including its calculated size.
 */
export interface ItemWithSize extends ItemWithTernaryAttributes {
  size_px: number;
}


// --- Data Processing Functions ---

/**
 * Calculates base ternary proportions (P_US, P_Russia, P_Middle) and TotalMentions
 * from raw counts, replicating the specific normalization logic from the legacy Python script.
 * @param items - An array of items with raw count columns.
 * @param config - Configuration specifying the names of the count columns.
 * @returns A new array of items with added ternary attributes.
 */
export function calculateBaseTernaryAttributes(
  items: RawCountItem[],
  config: TernaryAttributesConfig
): ItemWithTernaryAttributes[] {
  if (!items || items.length === 0) {
    return [];
  }

  const { us_count_col, russia_count_col, middle_count_col } = config;

  // Calculate total mentions for each group across all items
  const totalUsMentions = items.reduce((sum, item) => sum + (Number(item[us_count_col]) || 0), 0);
  const totalRussiaMentions = items.reduce((sum, item) => sum + (Number(item[russia_count_col]) || 0), 0);
  const totalMiddleMentions = items.reduce((sum, item) => sum + (Number(item[middle_count_col]) || 0), 0);

  return items.map(item => {
    const usCount = Number(item[us_count_col]) || 0;
    const russiaCount = Number(item[russia_count_col]) || 0;
    const middleCount = Number(item[middle_count_col]) || 0;

    const totalMentions = usCount + russiaCount + middleCount;

    // Calculate relative frequencies (r_X) for the item
    const r_us = totalUsMentions > 0 ? usCount / totalUsMentions : 0;
    const r_russia = totalRussiaMentions > 0 ? russiaCount / totalRussiaMentions : 0;
    const r_middle = totalMiddleMentions > 0 ? middleCount / totalMiddleMentions : 0;

    const r_sum = r_us + r_russia + r_middle;

    // Normalize the relative frequencies to get the P-values
    const p_us = r_sum > 1e-9 ? r_us / r_sum : 1 / 3;
    const p_russia = r_sum > 1e-9 ? r_russia / r_sum : 1 / 3;
    const p_middle = r_sum > 1e-9 ? r_middle / r_sum : 1 / 3;

    return {
      ...item,
      TotalMentions: totalMentions,
      P_US: p_us,
      P_Russia: p_russia,
      P_Middle: p_middle,
    };
  });
}

/**
 * Recalculates bubble sizes for plotting based on 'TotalMentions'.
 * Uses a logarithmic scale to prevent large values from dominating the visualization.
 * @param items - An array of items that include a 'TotalMentions' property.
 * @param config - Configuration for min/max size and scaling power.
 * @returns A new array of items with an added 'size_px' property.
 */
export function recalculateBubbleSizes(
  items: ItemWithTernaryAttributes[],
  config: BubbleSizeConfig
): ItemWithSize[] {
  const { minSize, maxSize, scalingPower } = config;

  const itemsForSizing = items.filter(item => item.TotalMentions > 0);
  
  if (itemsForSizing.length === 0) {
    return items.map(item => ({ ...item, size_px: minSize }));
  }

  const scaledValues = itemsForSizing.map(item =>
    Math.pow(Math.log(item.TotalMentions), scalingPower)
  );

  const minScaled = Math.min(...scaledValues);
  const maxScaled = Math.max(...scaledValues);

  const sizeMap = new Map<string | number, number>();

  for (let i = 0; i < itemsForSizing.length; i++) {
    const item = itemsForSizing[i];
    const scaled = scaledValues[i];
    let normalized = 0.5; // Default if all values are the same

    if (maxScaled > minScaled) {
      normalized = (scaled - minScaled) / (maxScaled - minScaled);
    }
    
    const size = minSize + normalized * (maxSize - minSize);
    sizeMap.set(item.id, size);
  }

  return items.map(item => ({
    ...item,
    size_px: sizeMap.get(item.id) || minSize,
  }));
}