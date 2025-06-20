
// src/hooks/__tests__/useProcessedCountryData.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { UseQueryResult } from '@tanstack/react-query';
// FIX: Using robust path aliases for imports.
import { useCountryAnalysisData, type CountryAnalysisData, type CountryInfo, type CountryNgramWeight, type NgramStats } from '@/hooks';
import { useProcessedCountryData } from '@/hooks';

// Mock the raw data fetching hook.
// FIX: Mocking the aliased path for consistency.
vi.mock('@/hooks/useCountryAnalysisData');

// --- Mock Data ---
const mockNgramStats: NgramStats[] = [
  { ngram_id: 1, ngram: 'test ngram 1', count_A: 100, count_G: 50, count_BCDE: 20 },
  { ngram_id: 2, ngram: 'test ngram 2', count_A: 10, count_G: 80, count_BCDE: 40 },
];
const mockCountryWeights: CountryNgramWeight[] = [
  { country_speaker: 'ALB', ngram_id: 1, count_sentences_for_ngram_by_country: 400 },
  { country_speaker: 'ALB', ngram_id: 2, count_sentences_for_ngram_by_country: 34 },
];
const mockCountryInfo: CountryInfo[] = [
  { id: 'ALB', merge_name: 'ALB Albania', cpm_community_after_10_CPM_0_53: 'A' },
];

describe('useProcessedCountryData', () => {
  it('should return null when raw data is loading', () => {
    const mockLoadingResult = {
      data: undefined,
      isLoading: true,
      isError: false,
      error: null,
    } as UseQueryResult<CountryAnalysisData, Error>;
    vi.mocked(useCountryAnalysisData).mockReturnValue(mockLoadingResult);

    const { result } = renderHook(() => useProcessedCountryData(2.0));

    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should correctly process raw data into final centroid data', async () => {
    const mockSuccessResult = {
      data: {
        ngramStats: mockNgramStats,
        countryWeights: mockCountryWeights,
        countryInfo: mockCountryInfo,
      },
      isLoading: false,
      isError: false,
      error: null,
    } as UseQueryResult<CountryAnalysisData, Error>;
    vi.mocked(useCountryAnalysisData).mockReturnValue(mockSuccessResult);

    const { result } = renderHook(() => useProcessedCountryData(2.0));

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });

    const processedData = result.current.data;
    expect(processedData).toBeTypeOf('object');
    // FIX: Updated expectations based on the new logic which provides the full country list
    expect(processedData?.allCountries).toHaveLength(1);
    expect(processedData?.allCountries[0].name).toBe('ALB Albania');
    expect(processedData?.allCountries[0].totalMentions).toBe(434);

    expect(processedData?.countryCentroids).toHaveLength(1);
    expect(processedData?.groupCentroids).toHaveLength(3);

    const albData = processedData!.countryCentroids[0];
    expect(albData.centroid_group_name).toBe('ALB');
    expect(albData.P_US_centroid).toBeCloseTo(0.7024933);
    expect(albData.P_Russia_centroid).toBeCloseTo(0.1612863);
    expect(albData.total_weight_for_group).toBe(434);
    expect(albData.group).toBe('A');
    expect(albData.country_name).toBe('ALB Albania');
  });
});