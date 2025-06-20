
// src/hooks/useProcessedCountryData.ts
import { useMemo } from 'react';
import { useCountryAnalysisData } from './useCountryAnalysisData';
import { calculateBaseTernaryAttributes, RawCountItem } from '@/utils/ternaryDataProcessing';
import {
  calculateAmplifiedCoordinates,
  calculateCategoricalCentroids,
  assignColorsToCentroids,
  calculateWeightedGroupCentroids, // Correctly import the existing utility
  CategoricalWeight,
  CategoryInfo,
  Centroid,
  GroupDefinition,
  AmplifiedTernaryDataItem,
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

  const processedData = useMemo((): {
    groupCentroids: Centroid[];
    countryCentroids: FinalCentroid[];
  } | null => {
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

    // --- VERIFICATION LOGIC ---
    // Define the main groups, replicating the logic from legacy/app.py
    const groupCentroidDefinitions: Record<string, GroupDefinition> = {
        "US_Focus": { weight_col_name: 'count_A', label: 'US Centroid (Amplified)' },
        "Russia_Focus": { weight_col_name: 'count_G', label: 'Russia Centroid (Amplified)' },
        "Middle_Focus": { weight_col_name: 'count_BCDE', label: 'Middle Ground Centroid (Amplified)' },
    };
    
    // The items need to conform to AmplifiedTernaryDataItem which expects specific properties
    const amplifiedItemsForGroupCentroids: AmplifiedTernaryDataItem[] = amplifiedNgrams.map(item => ({
      id: item.id,
      P_US: item.P_US,
      P_Russia: item.P_Russia,
      P_Middle: item.P_Middle,
      P_US_amp: item.P_US_amp,
      P_Russia_amp: item.P_Russia_amp,
      P_Middle_amp: item.P_Middle_amp,
      count_A: Number(item.count_A) || 0,
      count_G: Number(item.count_G) || 0,
      count_BCDE: Number(item.count_BCDE) || 0,
    }));

    const groupCentroids = calculateWeightedGroupCentroids(amplifiedItemsForGroupCentroids, groupCentroidDefinitions);
    console.log("--- VERIFICATION: Group Centroids ---", JSON.parse(JSON.stringify(groupCentroids)));
    // --- END VERIFICATION LOGIC ---


    const mappedWeights: CategoricalWeight[] = rawData.countryWeights.map(w => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));

    const countryCentroids = calculateCategoricalCentroids(
      amplifiedNgrams, mappedWeights, 'id', 'category_id', 'weight'
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
    let finalCountryCentroids = finalCentroidsWithColor.map(centroid => ({
      ...centroid,
      country_name: infoMap.get(centroid.centroid_group_name) || centroid.centroid_group_name,
    }));

    finalCountryCentroids.sort((a, b) => 
      a.centroid_group_name.localeCompare(b.centroid_group_name)
    );
    
    // For now, we'll return a placeholder here. The main goal is the console.log.
    return { groupCentroids, countryCentroids: finalCountryCentroids };

  }, [rawData, amplificationPower]);

  return { data: processedData, isLoading, isError, error };
};