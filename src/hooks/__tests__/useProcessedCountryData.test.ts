
// src/hooks/__tests__/useProcessedCountryData.test.ts
import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCountryAnalysisData, type NgramStats, type CountryNgramWeight, type CountryInfo } from '../useCountryAnalysisData';
import { useProcessedCountryData } from '../useProcessedCountryData';

// Mock the raw data fetching hook, which is the dependency of our hook under test.
vi.mock('../useCountryAnalysisData');

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
    // Arrange: Mock the dependency hook to be in a loading state.
    vi.mocked(useCountryAnalysisData).mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
      error: null,
    });

    // Act: Render our processing hook.
    const { result } = renderHook(() => useProcessedCountryData(2.0));

    // Assert: The processed data should be null.
    expect(result.current.data).toBeNull();
    expect(result.current.isLoading).toBe(true);
  });

  it('should correctly process raw data into final centroid data', async () => {
    // Arrange: Mock the dependency hook to return our controlled dataset.
    vi.mocked(useCountryAnalysisData).mockReturnValue({
      data: {
        ngramStats: mockNgramStats,
        countryWeights: mockCountryWeights,
        countryInfo: mockCountryInfo,
      },
      isLoading: false,
      isError: false,
      error: null,
    });

    // Act: Render our processing hook.
    const { result } = renderHook(() => useProcessedCountryData(2.0));

    // Assert: Wait for the useMemo to run and check the output directly.
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
      expect(result.current.data).not.toBeNull();
    });

    const processedData = result.current.data;
    expect(processedData).toHaveLength(1);

    const albData = processedData![0];
    expect(albData.centroid_group_name).toBe('ALB');
    expect(albData.P_US_centroid).toBeCloseTo(0.7024933);
    expect(albData.P_Russia_centroid).toBeCloseTo(0.1612863);
    expect(albData.total_weight_for_group).toBe(434);
    expect(albData.group).toBe('A');
    expect(albData.country_name).toBe('ALB Albania');
  });
});