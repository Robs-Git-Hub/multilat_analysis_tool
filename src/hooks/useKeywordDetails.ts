
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface KeywordSpeakerData {
  speaker: string;
  speaker_type: string | null;
  country_community: string | null;
  sentence_count: number;
  total_sentences: number;
  usage_frequency: number;
  sample_sentences: string[];
}

export interface KeywordDetails {
  ngram: string;
  total_usage_count: number;
  speaker_breakdown: KeywordSpeakerData[];
  community_stats: {
    A: number;
    BCDE: number;
    F: number;
    G: number;
  };
  sample_sentences: string[];
}

export const useKeywordDetails = (keyword: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['keyword-details', keyword],
    queryFn: async (): Promise<KeywordDetails | null> => {
      console.log('Fetching keyword details for:', keyword);
      
      if (!keyword.trim()) {
        return null;
      }

      // First, get the ngram statistics
      const { data: ngramStats, error: ngramError } = await supabase
        .from('oewg_ngram_statistics')
        .select('*')
        .eq('ngram', keyword)
        .single();

      if (ngramError) {
        console.error('Error fetching ngram statistics:', ngramError);
        throw ngramError;
      }

      if (!ngramStats) {
        console.log('No statistics found for keyword:', keyword);
        return null;
      }

      // Get sentence samples with speaker information
      const { data: sentenceSamples, error: sentenceError } = await supabase
        .from('vw_ngram_sentence_unpivoted')
        .select(`
          sentence_full,
          intervention_id
        `)
        .eq('ngram', keyword)
        .limit(50);

      if (sentenceError) {
        console.error('Error fetching sentence samples:', sentenceError);
        throw sentenceError;
      }

      // Get intervention details for the sentence samples
      const interventionIds = sentenceSamples?.map(s => s.intervention_id) || [];
      const { data: interventions, error: interventionError } = await supabase
        .from('intervention')
        .select('id, speaker, speaker_type')
        .in('id', interventionIds);

      if (interventionError) {
        console.error('Error fetching intervention details:', interventionError);
        throw interventionError;
      }

      // Create a map of intervention_id to speaker info
      const interventionMap = new Map(
        interventions?.map(i => [i.id, { speaker: i.speaker, speaker_type: i.speaker_type }]) || []
      );

      // Group sentences by speaker
      const speakerGroups = new Map<string, {
        speaker_type: string | null;
        sentences: string[];
      }>();

      sentenceSamples?.forEach(sample => {
        const intervention = interventionMap.get(sample.intervention_id);
        if (intervention?.speaker) {
          const existing = speakerGroups.get(intervention.speaker) || {
            speaker_type: intervention.speaker_type,
            sentences: []
          };
          existing.sentences.push(sample.sentence_full);
          speakerGroups.set(intervention.speaker, existing);
        }
      });

      // Calculate speaker breakdown
      const speaker_breakdown: KeywordSpeakerData[] = Array.from(speakerGroups.entries()).map(
        ([speaker, data]) => ({
          speaker,
          speaker_type: data.speaker_type,
          country_community: null, // We'll need to join with country table for this
          sentence_count: data.sentences.length,
          total_sentences: 0, // Would need additional query to calculate
          usage_frequency: 0, // Would need additional calculation
          sample_sentences: data.sentences.slice(0, 3), // First 3 as samples
        })
      );

      const result: KeywordDetails = {
        ngram: keyword,
        total_usage_count: ngramStats.count_all_communities,
        speaker_breakdown,
        community_stats: {
          A: ngramStats.count_A,
          BCDE: ngramStats.count_BCDE,
          F: ngramStats.count_F,
          G: ngramStats.count_G,
        },
        sample_sentences: sentenceSamples?.slice(0, 10).map(s => s.sentence_full) || [],
      };

      console.log(`Successfully fetched details for keyword: ${keyword}`);
      return result;
    },
    enabled: enabled && keyword.trim().length > 0,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
};
