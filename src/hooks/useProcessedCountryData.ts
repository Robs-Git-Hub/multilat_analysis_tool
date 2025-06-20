
// src/hooks/useProcessedCountryData.ts
import { useMemo } from 'react';
import { useCountryAnalysisData, CountryAnalysisData } from './useCountryAnalysisData';
import { calculateBaseTernaryAttributes, RawCountItem } from '@/utils/ternaryDataProcessing';
import {
  calculateAmplifiedCoordinates,
  calculateCategoricalCentroids,
  assignColorsToCentroids,
  calculateWeightedGroupCentroids,
  CategoricalWeight,
  CategoryInfo,
  Centroid,
  AmplifiedTernaryDataItem,
} from '@/utils/ternaryCalculations';
import { MAIN_GROUP_CENTROID_DEFINITIONS, COMMUNITY_COLOR_MAP } from '@/config/countryChartConfig';

// FIX: Exported the types for use in other modules.
export interface FinalCountryCentroid extends Centroid {
  group?: string;
  marker_color_final: string;
  country_name: string;
}

export interface ProcessedCountryData {
  groupCentroids: Centroid[];
  countryCentroids: FinalCountryCentroid[];
}

/**
 * @file useProcessedCountryData.ts
 * @summary Encapsulates the complete data processing pipeline for the Country Analysis page.
 */
export const useProcessedCountryData = (amplificationPower: number) => {
  const { data: rawData, isLoading, isError, error } = useCountryAnalysisData();

  const processedData = useMemo((): ProcessedCountryData | null => {
    if (!rawData) return null;

    const compliantNgramStats: RawCountItem[] = rawData.ngramStats.map((stat: CountryAnalysisData['ngramStats'][0]) => ({
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

    const amplifiedItemsForGroupCentroids: AmplifiedTernaryDataItem[] = amplifiedNgrams.map(item => ({
      id: item.id,
      P_US: item.P_US, P_Russia: item.P_Russia, P_Middle: item.P_Middle,
      P_US_amp: item.P_US_amp, P_Russia_amp: item.P_Russia_amp, P_Middle_amp: item.P_Middle_amp,
      count_A: Number(item.count_A) || 0,
      count_G: Number(item.count_G) || 0,
      count_BCDE: Number(item.count_BCDE) || 0,
    }));
    const groupCentroids = calculateWeightedGroupCentroids(amplifiedItemsForGroupCentroids, MAIN_GROUP_CENTROID_DEFINITIONS);

    const mappedWeights: CategoricalWeight[] = rawData.countryWeights.map((w: CountryAnalysisData['countryWeights'][0]) => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));
    const countryCentroids = calculateCategoricalCentroids(amplifiedNgrams, mappedWeights, 'id', 'category_id', 'weight');

    const mappedCountryInfo: (CategoryInfo & { name: string })[] = rawData.countryInfo.map((ci: CountryAnalysisData['countryInfo'][0]) => ({
        id: ci.id,
        group: ci.cpm_community_after_10_CPM_0_53,
        name: ci.merge_name,
    }));
    const finalCentroidsWithColor = assignColorsToCentroids(countryCentroids, mappedCountryInfo, 'centroid_group_name', 'id', 'group', COMMUNITY_COLOR_MAP);
    
    const infoMap = new Map(mappedCountryInfo.map(info => [info.id, info.name]));
    const finalCountryCentroids = finalCentroidsWithColor.map(centroid => ({
      ...centroid,
      country_name: infoMap.get(centroid.centroid_group_name) || centroid.centroid_group_name,
    }));
    finalCountryCentroids.sort((a, b) => a.country_name.localeCompare(b.country_name));
    
    return { groupCentroids, countryCentroids: finalCountryCentroids };

  }, [rawData, amplificationPower]);

  return { data: processedData, isLoading, isError, error };
};