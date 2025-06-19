
// src/hooks/__tests__/useConfigurableTernaryData.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useConfigurableTernaryData, TernaryDataItem } from '../useConfigurableTernaryData';
import { TERNARY_CHART_CONFIGS } from '@/config/ternaryChartConfigs';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
};

describe('useConfigurableTernaryData', () => {
  const ngramsConfig = TERNARY_CHART_CONFIGS['ngrams'];

  const mockRawApiData = [
    { ngram: 'sustainable development', count_A: 10, count_G: 20, count_BCDE: 70 },
    { ngram: 'human rights', count_A: 30, count_G: 0, count_BCDE: 10 },
  ];

  const expectedProcessedData: TernaryDataItem[] = [
    {
      id: 'sustainable development',
      ngram: 'sustainable development',
      count_A: 10,
      count_G: 20,
      count_BCDE: 70,
      TotalMentions: 100,
      P_US: 0.11764705882352941,
      P_Russia: 0.47058823529411764,
      P_Middle: 0.4117647058823529,
    },
    {
      id: 'human rights',
      ngram: 'human rights',
      count_A: 30,
      count_G: 0,
      count_BCDE: 10,
      TotalMentions: 40,
      P_US: 0.8571428571428571,
      P_Russia: 0,
      P_Middle: 0.14285714285714285,
    },
  ];

  it('should fetch raw data using the provided config and process it', async () => {
    server.use(
      http.get(`https://*.supabase.co/rest/v1/${ngramsConfig.table}`, () => {
        return HttpResponse.json(mockRawApiData);
      })
    );

    const { result } = renderHook(() => useConfigurableTernaryData(ngramsConfig), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(expectedProcessedData);
  });

  it('should handle API errors gracefully', async () => {
    server.use(
      http.get(`https://*.supabase.co/rest/v1/${ngramsConfig.table}`, () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    const { result } = renderHook(() => useConfigurableTernaryData(ngramsConfig), {
      wrapper: createWrapper(),
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeInstanceOf(Error);
  });
});