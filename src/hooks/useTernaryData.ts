
// src/hooks/useTernaryData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { calculateBaseTernaryAttributes, ItemWithTernaryAttributes } from '@/utils/ternaryDataProcessing';

// The hook now returns data that has been processed by our utility function.
export type TernaryDataItem = ItemWithTernaryAttributes;

/**
 * Fetches and processes ngram statistics for the ternary plot.
 */
export const useTernaryData = () => {
  return useQuery<TernaryDataItem[], Error>({
    queryKey: ['ternaryData'],
    queryFn: async () => {
      console.log('[DEBUG] Step 0: Starting fetch in useTernaryData...');
      
      const { data, error } = await supabase
        .from('oewg_ngram_statistics')
        .select('ngram, count_A, count_G, count_BCDE')
        .limit(5000);

      // --- DIAGNOSTIC LOG #1: Inspect the raw response from Supabase ---
      console.log('[DEBUG] Step 1: Raw Supabase Response Received');
      console.log(`[DEBUG]   - Error object:`, error);
      console.log(`[DEBUG]   - Data object received:`, data);
      console.log(`[DEBUG]   - Number of rows received: ${data?.length}`);
      // Let's inspect the last item to see if it's still an 'A' word
      if (data && data.length > 0) {
        console.log(`[DEBUG]   - Last item ngram: "${data[data.length - 1].ngram}"`);
      }
      // --- End of Diagnostic Log #1 ---

      if (error) {
        console.error("Error fetching ternary data:", error);
        throw new Error(error.message);
      }
      
      // It's possible for `data` to be null even without an error.
      if (!data) {
        console.warn("[DEBUG] Data from Supabase is null or undefined, returning empty array.");
        return [];
      }

      const rawDataWithIds = data.map(item => ({
        ...item,
        id: item.ngram,
      }));

      const processedData = calculateBaseTernaryAttributes(rawDataWithIds, {
        us_count_col: 'count_A',
        russia_count_col: 'count_G',
        middle_count_col: 'count_BCDE',
      });
      
      // --- DIAGNOSTIC LOG #2: Inspect the final processed data ---
      console.log('[DEBUG] Step 2: Data after processing');
      console.log(`[DEBUG]   - Number of rows after processing: ${processedData.length}`);
      // --- End of Diagnostic Log #2 ---

      return processedData;
    },
  });
};