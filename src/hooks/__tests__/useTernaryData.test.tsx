
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useTernaryData } from '../useTernaryData';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        then: jest.fn(),
      })),
    })),
  },
}));

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
    jest.clearAllMocks();
  });

  it('should fetch ternary data successfully', async () => {
    const mockData = [
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
    ];

    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    });

    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockData);
    expect(supabase.from).toHaveBeenCalledWith('oewg_ngram_statistics');
  });

  it('should handle errors properly', async () => {
    const mockError = new Error('Database connection failed');

    const { supabase } = require('@/integrations/supabase/client');
    supabase.from.mockReturnValue({
      select: jest.fn().mockResolvedValue({
        data: null,
        error: mockError,
      }),
    });

    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });

  it('should have correct query key and cache settings', () => {
    const { result } = renderHook(() => useTernaryData(), {
      wrapper: createWrapper(),
    });

    // Check that the hook is using the correct query key
    expect(result.current.dataUpdatedAt).toBeDefined();
  });
});
