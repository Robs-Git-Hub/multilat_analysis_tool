
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTernaryData } from '../useTernaryData';
import { supabase } from '@/integrations/supabase/client';
import { vi } from 'vitest';

// Mock Supabase client
vi.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}));

const mockedSupabase = vi.mocked(supabase);

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch and transform ternary data successfully', async () => {
    // FIX: This is the raw data as it comes from Supabase, with potential nulls.
    const mockRawData = [
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
        normalized_frequency_A: null,
        normalized_frequency_BCDE: 0.5,
        normalized_frequency_F: null,
        normalized_frequency_G: 0.5,
        count_A: null,
        count_BCDE: 50,
        count_F: null,
        count_G: 50,
        p_value: null,
        lor_polarization_score: null,
      },
    ];

    // FIX: This is the clean, transformed data we expect the hook to return.
    const expectedTransformedData = [
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

    // FIX: Cast the mock's return value to `any` to avoid type conflicts with the complex Supabase types.
    mockedSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: mockRawData,
        error: null,
      }),
    } as any);

    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // FIX: Assert against the expected transformed data.
    expect(result.current.data).toEqual(expectedTransformedData);
    expect(mockedSupabase.from).toHaveBeenCalledWith('oewg_ngram_statistics');
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Database connection failed');

    mockedSupabase.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    } as any);

    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});
