
// src/pages/CountryAnalysisPage.tsx
"use client";

import { useMemo, useState } from 'react';
import { useCountryAnalysisData } from '@/hooks/useCountryAnalysisData';
import { calculateBaseTernaryAttributes, RawCountItem } from '@/utils/ternaryDataProcessing';
import {
  calculateAmplifiedCoordinates,
  calculateCategoricalCentroids,
  assignColorsToCentroids,
  CategoricalWeight,
  CategoryInfo,
  Centroid,
} from '@/utils/ternaryCalculations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const COMMUNITY_COLOR_MAP: Record<string, string> = {
  'A': '#36656a', // Teal
  'G': '#e3867f', // Salmon
  'DEFAULT': '#a0aec0', // Gray
};

interface FinalCentroid extends Centroid {
  group?: string;
  marker_color_final: string;
  country_name: string;
}

const CountryAnalysisPage = () => {
  const [amplificationPower] = useState(2.0);
  const { data, isLoading, isError, error } = useCountryAnalysisData();

  const processedCentroidData = useMemo((): FinalCentroid[] | null => {
    if (!data) return null;

    const compliantNgramStats: RawCountItem[] = data.ngramStats.map(stat => ({
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

    const mappedWeights: CategoricalWeight[] = data.countryWeights.map(w => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));

    const countryCentroids = calculateCategoricalCentroids(
      amplifiedNgrams, mappedWeights, 'ngram_id', 'category_id', 'weight'
    );

    const mappedCountryInfo: (CategoryInfo & { name: string })[] = data.countryInfo.map(ci => ({
        id: ci.id, // The 3-letter code to join on.
        group: ci.cpm_community_after_10_CPM_0_53,
        name: ci.merge_name, // The full name for display.
    }));

    const finalCentroidsWithColor = assignColorsToCentroids(
      countryCentroids, mappedCountryInfo, 'centroid_group_name', 'id', 'group', COMMUNITY_COLOR_MAP
    );
    
    const infoMap = new Map(mappedCountryInfo.map(info => [info.id, info.name]));
    let finalCentroids = finalCentroidsWithColor.map(centroid => ({
      ...centroid,
      country_name: infoMap.get(centroid.centroid_group_name) || centroid.centroid_group_name,
    }));

    // FINAL STEP: Sort the centroids alphabetically by country ID for easier verification.
    finalCentroids.sort((a, b) => 
      a.centroid_group_name.localeCompare(b.centroid_group_name)
    );

    // --- VERIFICATION STEP ---
    console.log('--- VERIFICATION (STABLE & SORTED): Processed Centroid Data ---', finalCentroids);
    return finalCentroids;

  }, [data, amplificationPower]);

  const renderContent = () => {
    if (isLoading) {
      return <Skeleton className="w-full h-64" />;
    }

    if (isError) {
      return (
        <div className="text-red-600 bg-red-50 p-4 rounded-md">
          <p><strong>Error:</strong> Failed to load or process data.</p>
          <p className="text-sm">{error?.message}</p>
        </div>
      );
    }
    
    if (processedCentroidData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Verification: Stable & Complete Centroid Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              This data should now be stable (no flickering) and complete. Please verify that countries appear correctly and have the proper `marker_color_final` and `country_name` properties.
            </p>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto h-[600px]">
              {JSON.stringify(processedCentroidData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      );
    }

    return <p>No data available.</p>;
  };

  return (
    <div className="p-4 sm:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl font-semibold text-gray-900">Country Analysis</h1>
        <p className="mt-2 text-sm text-gray-600">
          This page will display the relative positioning of countries between different voting blocs.
        </p>
        <div className="mt-8">
          {renderContent()}
        </div>
      </div>
    </div>
  );
};

export default CountryAnalysisPage;