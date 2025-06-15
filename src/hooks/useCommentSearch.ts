
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

// FIX: Removed unused type aliases and their import.
// import type { Tables } from '@/integrations/supabase/types';
// type SpeechSentence = Tables<'speech_sentence'>;
// type Intervention = Tables<'intervention'>;

export interface CommentSearchResult {
  sentence_id: number;
  sentence_full: string;
  sentence_cleaned: string;
  intervention_id: number;
  speaker: string | null;
  speaker_type: string | null;
  meeting: string | null;
  session_number: number | null;
  agenda_item: string | null;
}

export interface CommentSearchFilters {
  speaker?: string;
  session_number?: number;
  speaker_type?: string;
  meeting?: string;
}

export const useCommentSearch = (
  searchTerm: string,
  filters: CommentSearchFilters = {},
  enabled: boolean = true
) => {
  return useQuery({
    queryKey: ['comment-search', searchTerm, filters],
    queryFn: async (): Promise<CommentSearchResult[]> => {
      console.log('Searching comments with term:', searchTerm, 'filters:', filters);
      
      if (!searchTerm.trim()) {
        return [];
      }

      let query = supabase
        .from('speech_sentence')
        .select(`
          id,
          sentence_full,
          sentence_cleaned,
          intervention_id,
          intervention (
            speaker,
            speaker_type,
            meeting,
            session_number,
            agenda_item
          )
        `)
        .textSearch('sentence_full', searchTerm);

      // Apply filters through the intervention relation
      if (filters.speaker) {
        query = query.eq('intervention.speaker', filters.speaker);
      }
      if (filters.session_number) {
        query = query.eq('intervention.session_number', filters.session_number);
      }
      if (filters.speaker_type) {
        query = query.eq('intervention.speaker_type', filters.speaker_type);
      }
      if (filters.meeting) {
        query = query.eq('intervention.meeting', filters.meeting);
      }

      const { data, error } = await query.limit(100);

      if (error) {
        console.error('Error searching comments:', error);
        throw error;
      }

      // Transform the nested data structure
      const results: CommentSearchResult[] = (data || []).map((sentence: any) => ({
        sentence_id: sentence.id,
        sentence_full: sentence.sentence_full,
        sentence_cleaned: sentence.sentence_cleaned,
        intervention_id: sentence.intervention_id,
        speaker: sentence.intervention?.speaker || null,
        speaker_type: sentence.intervention?.speaker_type || null,
        meeting: sentence.intervention?.meeting || null,
        session_number: sentence.intervention?.session_number || null,
        agenda_item: sentence.intervention?.agenda_item || null,
      }));

      console.log(`Found ${results.length} matching sentences`);
      return results;
    },
    placeholderData: [],
    enabled: enabled && searchTerm.trim().length > 0,
    staleTime: 2 * 60 * 1000, // 2 minutes
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
};
