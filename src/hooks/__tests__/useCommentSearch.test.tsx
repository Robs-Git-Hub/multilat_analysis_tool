
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useCommentSearch } from '../useCommentSearch';
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

describe('useCommentSearch', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should search comments successfully', async () => {
    const mockData = [
      {
        id: 1,
        sentence_full: 'This is a test sentence about climate change',
        sentence_cleaned: 'test sentence climate change',
        intervention_id: 101,
        intervention: {
          speaker: 'United States',
          speaker_type: 'Country',
          meeting: 'OEWG-1',
          session_number: 1,
          agenda_item: 'Item 3',
        },
      },
    ];
    
    // FIX: Cast the mock's return value to `any` to satisfy TypeScript.
    mockedSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        textSearch: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: mockData,
          error: null,
        }),
      }),
    } as any);

    const { result } = renderHook(
      () => useCommentSearch('climate change'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toHaveLength(1);
    expect(result.current.data?.[0]).toMatchObject({
      sentence_id: 1,
      sentence_full: 'This is a test sentence about climate change',
      speaker: 'United States',
      speaker_type: 'Country',
    });
  });

  it('should not search when search term is empty', () => {
    const { result } = renderHook(
      () => useCommentSearch(''),
      { wrapper: createWrapper() }
    );

    expect(result.current.data).toEqual([]);
    expect(result.current.isFetching).toBe(false);
  });

  it('should apply filters correctly', async () => {
    const mockData: any[] = [];
    
    const mockQuery = {
      textSearch: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      }),
    };
    
    mockedSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue(mockQuery),
    } as any);

    const filters = {
      speaker: 'United States',
      session_number: 1,
    };

    renderHook(
      () => useCommentSearch('test', filters),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(mockQuery.eq).toHaveBeenCalledWith('intervention.speaker', 'United States');
      expect(mockQuery.eq).toHaveBeenCalledWith('intervention.session_number', 1);
    });
  });

  it('should handle search errors', async () => {
    const mockError = new Error('Search failed');
    
    mockedSupabase.from.mockReturnValue({
      select: vi.fn().mockReturnValue({
        textSearch: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({
          data: null,
          error: mockError,
        }),
      }),
    } as any);

    const { result } = renderHook(
      () => useCommentSearch('test search'),
      { wrapper: createWrapper() }
    );

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(mockError);
  });
});