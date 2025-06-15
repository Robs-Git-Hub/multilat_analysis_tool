
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type NgramStatistic = Tables<'oewg_ngram_statistics'>;

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
      console.log('Fetching ternary data from oewg_ngram_statistics...');
      
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
        console.error('Error fetching ternary data:', error);
        throw error;
      }

      console.log(`Successfully fetched ${data?.length || 0} ngram statistics`);
      return data || [];
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
};
