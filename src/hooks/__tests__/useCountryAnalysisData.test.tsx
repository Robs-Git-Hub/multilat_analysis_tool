
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { http, HttpResponse } from 'msw';
import { server } from '@/mocks/server';

// Use relative path for the hook being tested, as seen in other working tests.
import { useCountryAnalysisData, type NgramStats, type CountryNgramWeight, type CountryInfo } from '../useCountryAnalysisData';

// --- Mock Data ---
const mockNgramStats: NgramStats[] = [
  { ngram_id: 1, ngram: 'human rights', count_A: 10, count_G: 5, count_BCDE: 20 },
  { ngram_id: 2, ngram: 'climate change', count_A: 2, count_G: 15, count_BCDE: 8 },
];

const mockCountryWeights: CountryNgramWeight[] = [
  { country_speaker: 'USA', ngram_id: 1, count_sentences_for_ngram_by_country: 100 },
  { country_speaker: 'USA', ngram_id: 2, count_sentences_for_ngram_by_country: 10 },
  { country_speaker: 'RUS', ngram_id: 1, count_sentences_for_ngram_by_country: 5 },
  { country_speaker: 'RUS', ngram_id: 2, count_sentences_for_ngram_by_country: 120 },
];

const mockCountryInfo: CountryInfo[] = [
  { id: 'USA', merge_name: 'United States', cpm_community_after_10_CPM_0_53: 'A' },
  { id: 'RUS', merge_name: 'Russia', cpm_community_after_10_CPM_0_53: 'G' },
];

// --- Wrapper Factory (Matches working test pattern) ---
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

// --- Test Suite ---
describe('useCountryAnalysisData', () => {
  // Reset handlers after each test to ensure isolation.
  afterEach(() => {
    server.resetHandlers();
  });

  it('should fetch from three sources and return combined data structure', async () => {
    // Arrange: Provide mock responses for this specific test.
    server.use(
      http.get('https://*.supabase.co/rest/v1/analysis_ngram_community_stats', () => HttpResponse.json(mockNgramStats)),
      http.get('https://*.supabase.co/rest/v1/vw_country_ngram_sentence_counts', () => HttpResponse.json(mockCountryWeights)),
      http.get('https://*.supabase.co/rest/v1/country', () => HttpResponse.json(mockCountryInfo))
    );

    // Act: Render the hook using the wrapper factory.
    const { result } = renderHook(() => useCountryAnalysisData(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    const data = result.current.data;
    expect(data).toBeDefined();
    expect(data?.ngramStats).toEqual(mockNgramStats);
    expect(data?.countryWeights).toEqual(mockCountryWeights);
    expect(data?.countryInfo).toEqual(mockCountryInfo);
  });

  it('should return an error state if a network request fails', async () => {
    // Arrange: Provide an error response for this test.
    server.use(
      http.get('https://*.supabase.co/rest/v1/analysis_ngram_community_stats', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    // Act
    const { result } = renderHook(() => useCountryAnalysisData(), {
      wrapper: createWrapper(),
    });

    // Assert
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});