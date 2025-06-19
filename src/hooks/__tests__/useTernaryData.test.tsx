
// src/hooks/__tests__/useTernaryData.test.tsx

import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTernaryData, TernaryDataItem } from '../useTernaryData';
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
  // Define the raw data our mock API will return.
  const mockRawApiData = [
    { ngram: 'sustainable development', count_A: 10, count_G: 20, count_BCDE: 70 },
    { ngram: 'human rights', count_A: 30, count_G: 0, count_BCDE: 10 },
  ];

  // This is the expected result AFTER our hook processes the raw data.
  // This data is calculated based on the logic in `calculateBaseTernaryAttributes`.
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
      P_US: 0.8823529411764706,
      P_Russia: 0,
      P_Middle: 0.11764705882352941,
    },
  ];

  beforeEach(() => {
    // Set up the mock handler to return our raw data for all tests in this suite.
    server.use(
      http.get('https://*.supabase.co/rest/v1/oewg_ngram_statistics', () => {
        return HttpResponse.json(mockRawApiData);
      })
    );
  });

  it('should fetch raw data and process it into ternary attributes', async () => {
    // ARRANGE: The mock server is already configured in the beforeEach hook.

    // ACT: Render the hook.
    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    // ASSERT: Wait for the hook to finish fetching and processing.
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify that the hook's output matches our expected processed data.
    // This proves that the query and the transformation logic are working correctly together.
    expect(result.current.data).toEqual(expectedProcessedData);
  });

  it('should handle API errors gracefully', async () => {
    // ARRANGE: For this specific test, override the default handler to force an error.
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
