
// src/hooks/useProcessedCountryData.ts
import { useMemo } from 'react';
import { useCountryAnalysisData } from './useCountryAnalysisData';
import { calculateBaseTernaryAttributes, RawCountItem } from '@/utils/ternaryDataProcessing';
import {
  calculateAmplifiedCoordinates,
  calculateCategoricalCentroids,
  assignColorsToCentroids,
  CategoricalWeight,
  CategoryInfo,
  Centroid,
} from '@/utils/ternaryCalculations';

const COMMUNITY_COLOR_MAP: Record<string, string> = {
  'A': '#36656a', // Teal
  'G': '#e3867f', // Salmon
  'DEFAULT': '#a0aec0', // Gray
};

export interface FinalCentroid extends Centroid {
  group?: string;
  marker_color_final: string;
  country_name: string;
}

/**
 * A hook that encapsulates the complex data processing for the Country Analysis page.
 * It consumes the raw data from `useCountryAnalysisData` and returns the final,
 * processed centroid data ready for visualization.
 *
 * @param {number} amplificationPower - The power to apply for coordinate amplification.
 */
export const useProcessedCountryData = (amplificationPower: number) => {
  const { data: rawData, isLoading, isError, error } = useCountryAnalysisData();

  const processedData = useMemo((): FinalCentroid[] | null => {
    if (!rawData) return null;

    const compliantNgramStats: RawCountItem[] = rawData.ngramStats.map(stat => ({
      ...stat,
      id: stat.ngram_id,
    }));

    const ngramsWithAttributes = calculateBaseTernaryAttributes(
      compliantNgramStats,
      { us_count_col: 'count_A', russia_count_col: 'count_G', middle_count_col: 'count_BCDE' }
    );

    const amplifiedNgrams = calculateAmplifiedCoordinates(
      ngramsWithAttributes,
      amplificationPower
    );

    const mappedWeights: CategoricalWeight[] = rawData.countryWeights.map(w => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));

    const countryCentroids = calculateCategoricalCentroids(
      amplifiedNgrams, mappedWeights, 'ngram_id', 'category_id', 'weight'
    );

    const mappedCountryInfo: (CategoryInfo & { name: string })[] = rawData.countryInfo.map(ci => ({
        id: ci.id,
        group: ci.cpm_community_after_10_CPM_0_53,
        name: ci.merge_name,
    }));

    const finalCentroidsWithColor = assignColorsToCentroids(
      countryCentroids, mappedCountryInfo, 'centroid_group_name', 'id', 'group', COMMUNITY_COLOR_MAP
    );
    
    const infoMap = new Map(mappedCountryInfo.map(info => [info.id, info.name]));
    let finalCentroids = finalCentroidsWithColor.map(centroid => ({
      ...centroid,
      country_name: infoMap.get(centroid.centroid_group_name) || centroid.centroid_group_name,
    }));

    finalCentroids.sort((a, b) => 
      a.centroid_group_name.localeCompare(b.centroid_group_name)
    );
    
    return finalCentroids;

  }, [rawData, amplificationPower]);

  return { data: processedData, isLoading, isError, error };
};