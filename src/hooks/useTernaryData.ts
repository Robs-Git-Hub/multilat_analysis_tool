
// src/hooks/useTernaryData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateBaseTernaryAttributes, ItemWithTernaryAttributes } from '@/utils/ternaryDataProcessing';

// The hook now returns data that has been processed by our utility function.
export type TernaryDataItem = ItemWithTernaryAttributes;

/**
 * Fetches and processes ngram statistics for the ternary plot.
 *
 * This hook performs the following steps:
 * 1. Fetches the raw count data (`count_A`, `count_G`, `count_BCDE`) for all ngrams from Supabase.
 * 2. Processes this raw data using the `calculateBaseTernaryAttributes` utility function.
 *    This function calculates the normalized coordinates (P_US, P_Russia, P_Middle) and TotalMentions
 *    for each ngram, based on the distribution across the entire dataset.
 * 3. Returns the processed data, ready for visualization.
 */
export const useTernaryData = () => {
  return useQuery<TernaryDataItem[], Error>({
    queryKey: ['ternaryData'],
    queryFn: async () => {
      // 1. Fetch only the raw columns we need for the calculation.
      const { data, error } = await supabase
        .from('oewg_ngram_statistics')
        .select('ngram, count_A, count_G, count_BCDE');

      if (error) {
        console.error("Error fetching ternary data:", error);
        throw new Error(error.message);
      }

      // The `calculateBaseTernaryAttributes` function expects each item to have an `id`.
      // We map `ngram` to `id` to conform to the utility's contract.
      const rawDataWithIds = data.map(item => ({
        ...item,
        id: item.ngram,
      }));

      // 2. Process the raw data to calculate ternary attributes.
      const processedData = calculateBaseTernaryAttributes(rawDataWithIds, {
        us_count_col: 'count_A',
        russia_count_col: 'count_G',
        middle_count_col: 'count_BCDE',
      });

      return processedData;
    },
  });
};