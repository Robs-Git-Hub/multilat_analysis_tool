
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useKeywordDetails } from '../useKeywordDetails';

// Mock Supabase client
jest.mock('@/integrations/supabase/client', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
          limit: jest.fn(),
          in: jest.fn(),
        })),
        limit: jest.fn(() => ({
          in: jest.fn(),
        })),
        in: jest.fn(),
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
  
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

describe('useKeywordDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch keyword details successfully', async () => {
    const mockNgramStats = {
      ngram: 'climate change',
      count_all_communities: 100,
      count_A: 25,
      count_BCDE: 35,
      count_F: 20,
      count_G: 20,
    };

    const mockSentenceSamples = [
      { sentence_full: 'Climate change is urgent', intervention_id: 1 },
      { sentence_full: 'We must address climate change', intervention_id: 2 },
    ];

    const mockInterventions = [
      { id: 1, speaker: 'United States', speaker_type: 'Country' },
      { id: 2, speaker: 'European Union', speaker_type: 'Regional Group' },
    ];

    const { supabase } = require('@/integrations/supabase/client');
    
    // Mock the sequence of calls
    let callCount = 0;
    supabase.from.mockImplementation((table: string) => {
      callCount++;
      
      if (table === 'oewg_ngram_statistics') {
        return {
          select: () => ({
            eq: () => ({
              single: jest.fn().mockResolvedValue({
                data: mockNgramStats,
                error: null,
              }),
            }),
          }),
        };
      }
      
      if (table === 'vw_ngram_sentence_unpivoted') {
        return {
          select: () => ({
            eq: () => ({
              limit: jest.fn().mockResolvedValue({
                data: mockSentenceSamples,
                error: null,
              }),
            }),
          }),
        };
      }
      
      if (table === 'intervention') {
        return {
          select: () => ({
            in: jest.fn().mockResolvedValue({
              data: mockInterventions,
              error: null,
            }),
          }),
        };
      }
      
      return {
        select: () => ({ eq: () => ({ single: () => ({}) }) }),
      };
    });

    const { result } = renderHook(
      () => useKeywordDetails('climate change'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toMatchObject({
      ngram: 'climate change',
      total_usage_count: 100,
      community_stats: {
        A: 25,
        BCDE: 35,
        F: 20,
        G: 20,
      },
      speaker_breakdown: expect.any(Array),
      sample_sentences: expect.any(Array),
    });
  });

  it('should return null for empty keyword', async () => {
    const { result } = renderHook(
      () => useKeywordDetails(''),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.data).toBeUndefined();
    });
  });

  it('should handle missing ngram statistics', async () => {
    const { supabase } = require('@/integrations/supabase/client');
    
    supabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'No rows found' },
          }),
        }),
      }),
    });

    const { result } = renderHook(
      () => useKeywordDetails('nonexistent'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });

  it('should be disabled when enabled is false', () => {
    const { result } = renderHook(
      () => useKeywordDetails('test', false),
      { wrapper: createWrapper() }
    );

    expect(result.current.isFetching).toBe(false);
  });
});
