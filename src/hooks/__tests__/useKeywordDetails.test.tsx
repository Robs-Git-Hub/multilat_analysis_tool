
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useKeywordDetails } from '../useKeywordDetails';
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

describe('useKeywordDetails', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

    // FIX: Use `as any` to simplify mocking of the complex Supabase client chain.
    mockedSupabase.from.mockImplementation((table: string) => {
      if (table === 'oewg_ngram_statistics') {
        return {
          select: () => ({
            eq: () => ({
              single: vi.fn().mockResolvedValue({
                data: mockNgramStats,
                error: null,
              }),
            }),
          }),
        } as any;
      }
      
      if (table === 'vw_ngram_sentence_unpivoted') {
        return {
          select: () => ({
            eq: () => ({
              limit: vi.fn().mockResolvedValue({
                data: mockSentenceSamples,
                error: null,
              }),
            }),
          }),
        } as any;
      }
      
      if (table === 'intervention') {
        return {
          select: () => ({
            in: vi.fn().mockResolvedValue({
              data: mockInterventions,
              error: null,
            }),
          }),
        } as any;
      }
      
      return {
        select: () => ({ eq: () => ({ single: () => ({}) }) }),
      } as any;
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

  it('should return undefined for empty keyword', () => {
    const { result } = renderHook(
      () => useKeywordDetails(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toBeUndefined();
  });

  it('should handle missing ngram statistics', async () => {
    mockedSupabase.from.mockReturnValue({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'No rows found' },
          }),
        }),
      }),
    } as any);

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