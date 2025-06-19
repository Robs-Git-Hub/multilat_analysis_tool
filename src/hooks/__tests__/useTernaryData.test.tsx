
// src/hooks/__tests__/useTernaryData.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTernaryData, TernaryDataPoint } from '../useTernaryData';
import { server } from '@/mocks/server';
import { http, HttpResponse } from 'msw';

// Helper to create a React Query provider wrapper for our hook
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests for faster feedback
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useTernaryData', () => {
  it('should fetch data, transform nulls, and return it using the default mock', async () => {
    // ARRANGE: Define the final, clean data we expect the hook to produce.
    // This is based on the default mock data now defined in `src/mocks/handlers.ts`.
    const expectedTransformedData: TernaryDataPoint[] = [
      {
        ngram: 'test ngram',
        normalized_frequency_A: 0.1,
        normalized_frequency_BCDE: 0.2,
        normalized_frequency_F: 0.3,
        normalized_frequency_G: 0.4,
        count_A: 10,
        count_BCDE: 20,
        count_F: 30,
        count_G: 40,
        p_value: 0.05,
        lor_polarization_score: 1.5,
      },
      {
        ngram: 'null ngram',
        normalized_frequency_A: 0,
        normalized_frequency_BCDE: 0.5,
        normalized_frequency_F: 0,
        normalized_frequency_G: 0.5,
        count_A: 0,
        count_BCDE: 50,
        count_F: 0,
        count_G: 50,
        p_value: undefined,
        lor_polarization_score: undefined,
      },
    ];

    // ACT: Render the hook. It will now automatically use the default handler
    // from `src/mocks/handlers.ts`. No `server.use()` is needed here.
    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    // ASSERT: Wait for the hook to finish fetching and check the result.
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(expectedTransformedData);
  });

  it('should handle API errors gracefully', async () => {
    // ARRANGE: For this specific test, we override the default handler
    // to force an error response.
    server.use(
      http.get('https://*.supabase.co/rest/v1/oewg_ngram_statistics', () => {
        return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
      })
    );

    // ACT: Render the hook
    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    // ASSERT: Wait for the hook to enter the error state
    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeInstanceOf(Error);
  });
});
