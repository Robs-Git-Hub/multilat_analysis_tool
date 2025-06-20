
// src/hooks/useProcessedCountryData.ts
import { useMemo } from 'react';
import { useCountryAnalysisData, CountryInfo, CountryNgramWeight, NgramStats } from './useCountryAnalysisData';
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

export interface FinalCountryCentroid extends Centroid {
  group?: string;
  marker_color_final: string;
  country_name: string;
}

export interface CountryListItem {
  id: string;
  name: string;
  totalMentions: number;
}

export interface ProcessedCountryData {
  groupCentroids: Centroid[];
  countryCentroids: FinalCountryCentroid[];
  allCountries: CountryListItem[];
}

/**
 * @file useProcessedCountryData.ts
 * @summary Encapsulates the complete data processing pipeline for the Country Analysis page.
 */
export const useProcessedCountryData = (
  amplificationPower: number,
  selectedCountryIds: string[] = []
) => {
  const { data: rawData, isLoading, isError, error } = useCountryAnalysisData();

  const processedData = useMemo((): ProcessedCountryData | null => {
    if (!rawData) return null;

    // --- Step 1: Prepare the list of all countries for the dropdown UI ---
    const mentionsPerCountry = rawData.countryWeights.reduce((acc: Record<string, number>, weight: CountryNgramWeight) => {
      const countryId = weight.country_speaker;
      const count = weight.count_sentences_for_ngram_by_country;
      acc[countryId] = (acc[countryId] || 0) + count;
      return acc;
    }, {});

    const allCountries: CountryListItem[] = rawData.countryInfo
      .map((ci: CountryInfo) => ({
        id: ci.id,
        name: ci.merge_name,
        totalMentions: mentionsPerCountry[ci.id] || 0,
      }))
      .sort((a: CountryListItem, b: CountryListItem) => a.name.localeCompare(b.name));
    
    // --- Step 2: Filter country weights based on selections ---
    const filteredCountryWeights =
      selectedCountryIds.length > 0
        ? rawData.countryWeights.filter((w: CountryNgramWeight) => selectedCountryIds.includes(w.country_speaker))
        : rawData.countryWeights;

    // --- Step 3: Proceed with all chart calculations using the filtered data ---
    const compliantNgramStats: RawCountItem[] = rawData.ngramStats.map((stat: NgramStats) => ({
      ...stat,
      id: stat.ngram_id,
    }));

    const ngramsWithAttributes = calculateBaseTernaryAttributes(
      // FIX: Corrected the typo from 'compliantNgramSts' to 'compliantNgramStats'.
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

    const mappedWeights: CategoricalWeight[] = filteredCountryWeights.map((w: CountryNgramWeight) => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));
    const countryCentroids = calculateCategoricalCentroids(amplifiedNgrams, mappedWeights, 'id', 'category_id', 'weight');

    const mappedCountryInfo: (CategoryInfo & { name: string })[] = rawData.countryInfo.map((ci: CountryInfo) => ({
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
    
    return { groupCentroids, countryCentroids: finalCountryCentroids, allCountries };

  }, [rawData, amplificationPower, selectedCountryIds]);

  return { data: processedData, isLoading, isError, error };
};