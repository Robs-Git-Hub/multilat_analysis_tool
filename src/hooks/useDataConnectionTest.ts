
// File: src/hooks/useDataConnectionTest.ts

import { useState, useEffect } from 'react';
import { supabase } from '../integrations/supabase/client';

// Define a type for our test data to ensure type safety
export interface TestData {
  ngramStats: any;
  countryCounts: any;
  countryData: any;
}

export function useDataConnectionTest() {
  const [data, setData] = useState<TestData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTestData = async () => {
      try {
        // Fetch the first row from oewg_ngram_statistics
        const ngramStatsPromise = supabase
          .from('oewg_ngram_statistics')
          .select('*')
          .limit(1)
          .single(); // .single() returns one object, not an array

        // Fetch the first row from vw_country_ngram_sentence_counts
        const countryCountsPromise = supabase
          .from('vw_country_ngram_sentence_counts')
          .select('*')
          .limit(1)
          .single();

        // Fetch the first row from country
        const countryDataPromise = supabase
          .from('country')
          .select('*')
          .limit(1)
          .single();

        // Run all queries in parallel for efficiency
        const [
          ngramStatsResult,
          countryCountsResult,
          countryDataResult,
        ] = await Promise.all([
          ngramStatsPromise,
          countryCountsPromise,
          countryDataPromise,
        ]);

        // Check for errors in each query
        if (ngramStatsResult.error) throw new Error(`Ngram Stats Error: ${ngramStatsResult.error.message}`);
        if (countryCountsResult.error) throw new Error(`Country Counts Error: ${countryCountsResult.error.message}`);
        if (countryDataResult.error) throw new Error(`Country Data Error: ${countryDataResult.error.message}`);

        // If all successful, set the data
        setData({
          ngramStats: ngramStatsResult.data,
          countryCounts: countryCountsResult.data,
          countryData: countryDataResult.data,
        });

      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTestData();
  }, []); // Empty dependency array means this runs once on mount

  return { data, error, isLoading };
}