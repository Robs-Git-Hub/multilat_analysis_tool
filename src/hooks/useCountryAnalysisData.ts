
// src/hooks/useCountryAnalysisData.ts
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// --- Type Definitions for our three data sources ---
export interface NgramStats {
  ngram_id: number;
  ngram: string;
  count_A: number;
  count_G: number;
  count_BCDE: number;
  [key: string]: any;
}

export interface CountryNgramWeight {
  country_speaker: string;
  ngram_id: number;
  count_sentences_for_ngram_by_country: number;
}

export interface CountryInfo {
  id: string;
  merge_name: string;
  cpm_community_after_10_CPM_0_53: string;
}

export interface CountryAnalysisData {
  ngramStats: NgramStats[];
  countryWeights: CountryNgramWeight[];
  countryInfo: CountryInfo[];
}

/**
 * Fetches all necessary data for the Country Analysis page from three separate sources.
 */
export const useCountryAnalysisData = () => {
  return useQuery<CountryAnalysisData, Error>({
    queryKey: ['countryAnalysisData'],
    queryFn: async () => {
      // This helper function remains the same, but we will assert the type at the call site.
      const fetchAll = async (table: string, columns: string) => {
        const PAGE_SIZE = 1000;
        let allRows: any[] = [];
        let page = 0;
        let keepFetching = true;

        while (keepFetching) {
          const { from, to } = { from: page * PAGE_SIZE, to: (page + 1) * PAGE_SIZE - 1 };
          
          // FIX: Add an .order() clause to ensure stable pagination.
          // Without this, the database provides no guarantee on the order of rows,
          // causing inconsistent data between fetches and leading to flickering UI.
          // We order by 'ngram_id' as it's a stable, unique identifier.
          const { data, error } = await supabase
            .from(table as any)
            .select(columns)
            .order('ngram_id', { ascending: true }) // <-- CRITICAL FIX
            .range(from, to);

          if (error) {
            console.error(`Error fetching paginated data from ${table}:`, error);
            throw new Error(error.message);
          }

          if (data && data.length > 0) {
            allRows.push(...data);
            if (data.length < PAGE_SIZE) {
              keepFetching = false;
            } else {
              page++;
            }
          } else {
            keepFetching = false;
          }
        }
        return allRows;
      };

      const [ngramStats, countryWeights, countryInfo] = await Promise.all([
        fetchAll('analysis_ngram_community_stats', 'ngram, count_A, count_G, count_BCDE, ngram_id'),
        // Note: The country weights table is small, so pagination isn't strictly necessary here,
        // but the fetchAll utility handles it safely anyway.
        fetchAll('vw_country_ngram_sentence_counts', 'country_speaker, ngram_id, count_sentences_for_ngram_by_country'),
        supabase.from('country').select('id, merge_name, cpm_community_after_10_CPM_0_53').then(res => {
          if (res.error) throw new Error(res.error.message);
          return res.data;
        }),
      ]);

      return {
        ngramStats: ngramStats as NgramStats[],
        countryWeights: countryWeights as CountryNgramWeight[],
        countryInfo: countryInfo as CountryInfo[],
      };
    },
    // Add staleTime to prevent overly aggressive refetching during development.
    // This means data is considered fresh for 1 minute.
    staleTime: 60 * 1000,
  });
};