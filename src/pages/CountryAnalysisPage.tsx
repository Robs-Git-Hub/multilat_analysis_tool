
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
} from '@/utils/ternaryCalculations';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

// Define a color map for the political communities.
// This makes it easy to manage colors from one central place.
const COMMUNITY_COLOR_MAP: Record<string, string> = {
  'A': '#36656a', // Teal
  'G': '#e3867f', // Salmon
  'DEFAULT': '#a0aec0', // Gray
};

const CountryAnalysisPage = () => {
  // We'll add UI controls for this later, for now, it's a constant.
  const [amplificationPower] = useState(2.0);

  const { data, isLoading, isError, error } = useCountryAnalysisData();

  const processedCentroidData = useMemo(() => {
    if (!data) return null;

    // --- START: Data Processing Pipeline ---

    // Step 0: Adapt the n-gram data to match the expected 'RawCountItem' interface.
    // The `calculateBaseTernaryAttributes` utility requires an 'id' property, but our
    // data source provides 'ngram_id'. We create a new array that satisfies the contract.
    const compliantNgramStats: RawCountItem[] = data.ngramStats.map(stat => ({
      ...stat,
      id: stat.ngram_id,
    }));

    // Step 1: Calculate the base P-values for each n-gram.
    const ngramsWithAttributes = calculateBaseTernaryAttributes(
      compliantNgramStats, // Use the new, compliant data
      {
        us_count_col: 'count_A',
        russia_count_col: 'count_G',
        middle_count_col: 'count_BCDE',
      }
    );

    // Step 2: Amplify the coordinates of each n-gram.
    const amplifiedNgrams = calculateAmplifiedCoordinates(
      ngramsWithAttributes,
      amplificationPower
    );

    // Step 3: Calculate the weighted centroid for each country.
    // We must map our data to the generic format the utility function expects.
    const mappedWeights: CategoricalWeight[] = data.countryWeights.map(w => ({
      item_id: w.ngram_id,
      category_id: w.country_speaker,
      weight: w.count_sentences_for_ngram_by_country,
    }));

    const countryCentroids = calculateCategoricalCentroids(
      amplifiedNgrams,
      mappedWeights,
      'ngram_id', // This is the 'item_id' column in the n-gram data.
      'category_id', // This is the 'category_id' column in our mapped weights.
      'weight' // This is the 'weight' column in our mapped weights.
    );

    // Step 4: Assign colors to each centroid based on its political community.
    // We map our country info to the generic format the utility function expects.
    const mappedCountryInfo: CategoryInfo[] = data.countryInfo.map(ci => ({
        id: ci.merge_name, // The ID to match against the centroid's group name.
        group: ci.cpm_community_after_10_CPM_0_53, // The group used for coloring.
    }));

    const finalCentroids = assignColorsToCentroids(
      countryCentroids,
      mappedCountryInfo,
      'centroid_group_name', // The key on the centroid object holding the country name.
      'id', // The key on the info object holding the country name.
      'group', // The key on the info object holding the political community ('A' or 'G').
      COMMUNITY_COLOR_MAP
    );

    // --- VERIFICATION STEP ---
    // Log the final output to the console to verify the structure.
    console.log('--- VERIFICATION: Processed Centroid Data ---', finalCentroids);
    // --- END: VERIFICATION STEP ---

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
            <CardTitle>Verification: Processed Centroid Data</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600 mb-4">
              The data below is the final output of our processing pipeline. Please check the browser's developer console for a more detailed view.
            </p>
            <pre className="bg-gray-100 p-4 rounded-md text-xs overflow-auto">
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