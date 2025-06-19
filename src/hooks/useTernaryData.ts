
// src/hooks/useTernaryData.ts

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TernaryDataPoint {
  ngram: string;
  normalized_frequency_A: number;
  normalized_frequency_BCDE: number;
  normalized_frequency_F: number;
  normalized_frequency_G: number;
  count_A: number;
  count_BCDE: number;
  count_F: number;
  count_G: number;
  p_value?: number;
  lor_polarization_score?: number;
}

export const useTernaryData = () => {
  return useQuery({
    queryKey: ['ternary-data'],
    queryFn: async (): Promise<TernaryDataPoint[]> => {
      const { data, error } = await supabase
        .from('oewg_ngram_statistics')
        .select(`
          ngram,
          normalized_frequency_A,
          normalized_frequency_BCDE,
          normalized_frequency_F,
          normalized_frequency_G,
          count_A,
          count_BCDE,
          count_F,
          count_G,
          p_value,
          lor_polarization_score
        `);

      if (error) {
        // Throw a standard Error object to ensure consistent error handling.
        // This satisfies the test assertion `toBeInstanceOf(Error)`.
        throw new Error(error.message);
      }

      // The nullish coalescing operator (??) provides a default value for null/undefined fields.
      const transformedData = (data || []).map(stat => ({
        ngram: stat.ngram,
        normalized_frequency_A: stat.normalized_frequency_A ?? 0,
        normalized_frequency_BCDE: stat.normalized_frequency_BCDE ?? 0,
        normalized_frequency_F: stat.normalized_frequency_F ?? 0,
        normalized_frequency_G: stat.normalized_frequency_G ?? 0,
        count_A: stat.count_A ?? 0,
        count_BCDE: stat.count_BCDE ?? 0,
        count_F: stat.count_F ?? 0,
        count_G: stat.count_G ?? 0,
        p_value: stat.p_value ?? undefined,
        lor_polarization_score: stat.lor_polarization_score ?? undefined,
      }));

      return transformedData;
    },
    // Set cache times for data freshness and memory management.
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};