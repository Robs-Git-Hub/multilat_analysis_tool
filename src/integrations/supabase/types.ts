export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      analysis_ai_labelled_topic_community_stats: {
        Row: {
          count_A: number
          count_all_communities: number
          count_BCDE: number
          count_F: number
          count_G: number
          dif_bcde_to_highest_polar: number | null
          dif_bcde_to_mid_polar_point: number | null
          focus_polarization_score: number | null
          lor_polarization_score: number | null
          normalized_frequency_A: number
          normalized_frequency_BCDE: number
          normalized_frequency_F: number
          normalized_frequency_G: number
          p_value_ag: number | null
          relative_frequency_A: number
          relative_frequency_BCDE: number
          relative_frequency_F: number
          relative_frequency_G: number
          topic_id: string
          topic_short_description: string | null
        }
        Insert: {
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
          topic_id: string
          topic_short_description?: string | null
        }
        Update: {
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
          topic_id?: string
          topic_short_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_ai_labelled_topic_community_stats_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: true
            referencedRelation: "oewg_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "analysis_ai_labelled_topic_community_stats_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: true
            referencedRelation: "vw_analysis_ai_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      analysis_bert_labelled_topic_community_stats: {
        Row: {
          bert_model_id: number
          count_A: number
          count_all_communities: number
          count_BCDE: number
          count_F: number
          count_G: number
          dif_bcde_to_highest_polar: number | null
          dif_bcde_to_mid_polar_point: number | null
          focus_polarization_score: number | null
          lor_polarization_score: number | null
          normalized_frequency_A: number
          normalized_frequency_BCDE: number
          normalized_frequency_F: number
          normalized_frequency_G: number
          p_value_ag: number | null
          relative_frequency_A: number
          relative_frequency_BCDE: number
          relative_frequency_F: number
          relative_frequency_G: number
          topic_id: number
          topic_short_description: string | null
        }
        Insert: {
          bert_model_id: number
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
          topic_id: number
          topic_short_description?: string | null
        }
        Update: {
          bert_model_id?: number
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
          topic_id?: number
          topic_short_description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_bert_labelled_topic_community_stats_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_bert_labelled_topic_community_stats_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "bert_topic_definition"
            referencedColumns: ["bert_topic_id"]
          },
          {
            foreignKeyName: "analysis_bert_labelled_topic_community_stats_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "vw_analysis_bert_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      analysis_ngram_clustering_silhouette_by_sentence: {
        Row: {
          cluster: number
          id: number
          ngram: string | null
          ngram_id: number
          optimal_clusters: number | null
          optimal_silhouette_score: number | null
        }
        Insert: {
          cluster: number
          id?: number
          ngram?: string | null
          ngram_id: number
          optimal_clusters?: number | null
          optimal_silhouette_score?: number | null
        }
        Update: {
          cluster?: number
          id?: number
          ngram?: string | null
          ngram_id?: number
          optimal_clusters?: number | null
          optimal_silhouette_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_ngram_clustering_silhouette_by_sentence_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_ngram_clustering_silhouette_by_sentence_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "analysis_ngram_clustering_silhouette_by_sentence_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
        ]
      }
      analysis_ngram_community_stats: {
        Row: {
          count_A: number
          count_all_communities: number
          count_BCDE: number
          count_F: number
          count_G: number
          dif_bcde_to_highest_polar: number | null
          dif_bcde_to_mid_polar_point: number | null
          focus_polarization_score: number | null
          lor_polarization_score: number | null
          ngram: string | null
          ngram_id: number
          normalized_frequency_A: number
          normalized_frequency_BCDE: number
          normalized_frequency_F: number
          normalized_frequency_G: number
          p_value_ag: number | null
          relative_frequency_A: number
          relative_frequency_BCDE: number
          relative_frequency_F: number
          relative_frequency_G: number
        }
        Insert: {
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          ngram?: string | null
          ngram_id: number
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
        }
        Update: {
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          dif_bcde_to_highest_polar?: number | null
          dif_bcde_to_mid_polar_point?: number | null
          focus_polarization_score?: number | null
          lor_polarization_score?: number | null
          ngram?: string | null
          ngram_id?: number
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value_ag?: number | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
        }
        Relationships: [
          {
            foreignKeyName: "analysis_ngram_community_stats_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: true
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_ngram_community_stats_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: true
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "analysis_ngram_community_stats_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: true
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
        ]
      }
      bert_models: {
        Row: {
          description: string | null
          id: number
          model_identifier: string
        }
        Insert: {
          description?: string | null
          id?: number
          model_identifier: string
        }
        Update: {
          description?: string | null
          id?: number
          model_identifier?: string
        }
        Relationships: []
      }
      bert_sentence_topic_probabilities: {
        Row: {
          bert_model_id: number
          bert_probability_score: number
          bert_topic_id: number
          bert_topic_rank: number
          intervention_id: number
          prediction_timestamp: string
          sentence_id: number
        }
        Insert: {
          bert_model_id: number
          bert_probability_score: number
          bert_topic_id: number
          bert_topic_rank: number
          intervention_id: number
          prediction_timestamp?: string
          sentence_id: number
        }
        Update: {
          bert_model_id?: number
          bert_probability_score?: number
          bert_topic_id?: number
          bert_topic_rank?: number
          intervention_id?: number
          prediction_timestamp?: string
          sentence_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bert_sentence_topic_probabilities_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "bert_topic_definition"
            referencedColumns: ["bert_topic_id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "vw_analysis_bert_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "bert_sentence_topic_probabilities_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
        ]
      }
      bert_speaker_avg_topic_probability: {
        Row: {
          average_probability: number
          bert_model_id: number
          bert_topic_id: number
          speaker: string
        }
        Insert: {
          average_probability: number
          bert_model_id: number
          bert_topic_id: number
          speaker: string
        }
        Update: {
          average_probability?: number
          bert_model_id?: number
          bert_topic_id?: number
          speaker?: string
        }
        Relationships: [
          {
            foreignKeyName: "bert_speaker_avg_topic_probability_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bert_speaker_avg_topic_probability_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "bert_topic_definition"
            referencedColumns: ["bert_topic_id"]
          },
          {
            foreignKeyName: "bert_speaker_avg_topic_probability_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "vw_analysis_bert_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      bert_speaker_pairwise_distance: {
        Row: {
          bert_model_id: number
          distance_metric: string
          distance_value: number
          speaker_1: string
          speaker_2: string
        }
        Insert: {
          bert_model_id: number
          distance_metric: string
          distance_value: number
          speaker_1: string
          speaker_2: string
        }
        Update: {
          bert_model_id?: number
          distance_metric?: string
          distance_value?: number
          speaker_1?: string
          speaker_2?: string
        }
        Relationships: [
          {
            foreignKeyName: "bert_speaker_pairwise_distance_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
        ]
      }
      bert_topic_definition: {
        Row: {
          bert_model_id: number
          bert_topic_id: number
          bert_topic_name_custom: string | null
          bert_topic_name_default: string | null
        }
        Insert: {
          bert_model_id: number
          bert_topic_id: number
          bert_topic_name_custom?: string | null
          bert_topic_name_default?: string | null
        }
        Update: {
          bert_model_id?: number
          bert_topic_id?: number
          bert_topic_name_custom?: string | null
          bert_topic_name_default?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bert_topic_definition_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
        ]
      }
      bert_topic_keywords: {
        Row: {
          bert_keyword: string
          bert_keyword_rank: number
          bert_keyword_score: number
          bert_model_id: number
          bert_topic_id: number
        }
        Insert: {
          bert_keyword: string
          bert_keyword_rank: number
          bert_keyword_score: number
          bert_model_id: number
          bert_topic_id: number
        }
        Update: {
          bert_keyword?: string
          bert_keyword_rank?: number
          bert_keyword_score?: number
          bert_model_id?: number
          bert_topic_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "bert_topic_keywords_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bert_topic_keywords_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "bert_topic_definition"
            referencedColumns: ["bert_topic_id"]
          },
          {
            foreignKeyName: "bert_topic_keywords_bert_topic_id_fkey"
            columns: ["bert_topic_id"]
            isOneToOne: false
            referencedRelation: "vw_analysis_bert_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      country: {
        Row: {
          cpm_cluster_after_10_res_0_53: number | null
          cpm_community_after_10_CPM_0_53: string | null
          id: string
          merge_name: string | null
          merge_name_with_pat_10: string | null
          morgus_30_swing_states: string | null
          pat_10: number | null
        }
        Insert: {
          cpm_cluster_after_10_res_0_53?: number | null
          cpm_community_after_10_CPM_0_53?: string | null
          id: string
          merge_name?: string | null
          merge_name_with_pat_10?: string | null
          morgus_30_swing_states?: string | null
          pat_10?: number | null
        }
        Update: {
          cpm_cluster_after_10_res_0_53?: number | null
          cpm_community_after_10_CPM_0_53?: string | null
          id?: string
          merge_name?: string | null
          merge_name_with_pat_10?: string | null
          morgus_30_swing_states?: string | null
          pat_10?: number | null
        }
        Relationships: []
      }
      intervention: {
        Row: {
          agenda_item: string | null
          apr_negotiation_round: string | null
          id: number
          meeting: string | null
          meeting_number: number | null
          session_number: number | null
          speaker: string | null
          speaker_type: string | null
          speech: string | null
          timestamp_end_hhmmss: string | null
          timestamp_start_hhmmss: string | null
          url_for_video: string | null
          within_meeting_index: number | null
        }
        Insert: {
          agenda_item?: string | null
          apr_negotiation_round?: string | null
          id: number
          meeting?: string | null
          meeting_number?: number | null
          session_number?: number | null
          speaker?: string | null
          speaker_type?: string | null
          speech?: string | null
          timestamp_end_hhmmss?: string | null
          timestamp_start_hhmmss?: string | null
          url_for_video?: string | null
          within_meeting_index?: number | null
        }
        Update: {
          agenda_item?: string | null
          apr_negotiation_round?: string | null
          id?: number
          meeting?: string | null
          meeting_number?: number | null
          session_number?: number | null
          speaker?: string | null
          speaker_type?: string | null
          speech?: string | null
          timestamp_end_hhmmss?: string | null
          timestamp_start_hhmmss?: string | null
          url_for_video?: string | null
          within_meeting_index?: number | null
        }
        Relationships: []
      }
      intervention_alternative_gender_source: {
        Row: {
          gender_not_from_photo: string | null
          intervention_id: number
          notes: string | null
        }
        Insert: {
          gender_not_from_photo?: string | null
          intervention_id: number
          notes?: string | null
        }
        Update: {
          gender_not_from_photo?: string | null
          intervention_id?: number
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_alternative_gender_source_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_alternative_gender_source_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_alternative_gender_source_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_alternative_gender_source_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
        ]
      }
      intervention_cleaned_words: {
        Row: {
          cleaned_words_only_text: string | null
          intervention_id: number
        }
        Insert: {
          cleaned_words_only_text?: string | null
          intervention_id: number
        }
        Update: {
          cleaned_words_only_text?: string | null
          intervention_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "intervention_cleaned_words_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_cleaned_words_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_cleaned_words_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_cleaned_words_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: true
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
        ]
      }
      intervention_photo: {
        Row: {
          able_to_take_photo: boolean | null
          gender_from_photo: string | null
          id: string
          intervention_id: number
          photo_filename: string | null
          url_video_at_photo: string | null
        }
        Insert: {
          able_to_take_photo?: boolean | null
          gender_from_photo?: string | null
          id: string
          intervention_id: number
          photo_filename?: string | null
          url_video_at_photo?: string | null
        }
        Update: {
          able_to_take_photo?: boolean | null
          gender_from_photo?: string | null
          id?: string
          intervention_id?: number
          photo_filename?: string | null
          url_video_at_photo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "intervention_photo_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "intervention_photo_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_photo_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "intervention_photo_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
        ]
      }
      junc_sentence_id_to_ngram_id: {
        Row: {
          ngram_id: number
          sentence_id: number
        }
        Insert: {
          ngram_id: number
          sentence_id: number
        }
        Update: {
          ngram_id?: number
          sentence_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
        ]
      }
      oewg_ngram_cluster_from_shared_sentences: {
        Row: {
          ngram_cluster_from_ss: number
          ngram_id: number
        }
        Insert: {
          ngram_cluster_from_ss: number
          ngram_id: number
        }
        Update: {
          ngram_cluster_from_ss?: number
          ngram_id?: number
        }
        Relationships: []
      }
      oewg_ngram_community_frequencies: {
        Row: {
          community: string
          frequency: number
          ngram: string
        }
        Insert: {
          community: string
          frequency: number
          ngram: string
        }
        Update: {
          community?: string
          frequency?: number
          ngram?: string
        }
        Relationships: []
      }
      oewg_ngram_filter_phrases: {
        Row: {
          filter_phrase: string
          from_which_round: string | null
          number_of_words: number | null
          reason: string | null
        }
        Insert: {
          filter_phrase: string
          from_which_round?: string | null
          number_of_words?: number | null
          reason?: string | null
        }
        Update: {
          filter_phrase?: string
          from_which_round?: string | null
          number_of_words?: number | null
          reason?: string | null
        }
        Relationships: []
      }
      oewg_ngram_sentence_samples: {
        Row: {
          ngram_id: number
          sentence_id: number
        }
        Insert: {
          ngram_id: number
          sentence_id: number
        }
        Update: {
          ngram_id?: number
          sentence_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
        ]
      }
      oewg_ngram_statistics: {
        Row: {
          bcde_raised_more: string | null
          count_A: number
          count_all_communities: number
          count_BCDE: number
          count_F: number
          count_G: number
          lor_polarization_score: number | null
          ngram: string
          normalized_frequency_A: number
          normalized_frequency_BCDE: number
          normalized_frequency_F: number
          normalized_frequency_G: number
          p_value: number | null
          p_value_ag_below_05: string | null
          relative_frequency_A: number
          relative_frequency_BCDE: number
          relative_frequency_F: number
          relative_frequency_G: number
        }
        Insert: {
          bcde_raised_more?: string | null
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          lor_polarization_score?: number | null
          ngram: string
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value?: number | null
          p_value_ag_below_05?: string | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
        }
        Update: {
          bcde_raised_more?: string | null
          count_A?: number
          count_all_communities?: number
          count_BCDE?: number
          count_F?: number
          count_G?: number
          lor_polarization_score?: number | null
          ngram?: string
          normalized_frequency_A?: number
          normalized_frequency_BCDE?: number
          normalized_frequency_F?: number
          normalized_frequency_G?: number
          p_value?: number | null
          p_value_ag_below_05?: string | null
          relative_frequency_A?: number
          relative_frequency_BCDE?: number
          relative_frequency_F?: number
          relative_frequency_G?: number
        }
        Relationships: []
      }
      oewg_ngram_usefulness_ai_rating: {
        Row: {
          api_call_round: number | null
          ngram_id: number
          rating: number
          rating_id: number
          reason: string | null
          source: string
        }
        Insert: {
          api_call_round?: number | null
          ngram_id: number
          rating: number
          rating_id?: number
          reason?: string | null
          source: string
        }
        Update: {
          api_call_round?: number | null
          ngram_id?: number
          rating?: number
          rating_id?: number
          reason?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
        ]
      }
      oewg_ngrams_to_topic_names: {
        Row: {
          coder: string
          ngram: string
          topic_name: string
        }
        Insert: {
          coder: string
          ngram: string
          topic_name: string
        }
        Update: {
          coder?: string
          ngram?: string
          topic_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngrams_to_topic_names_topic_name_fkey"
            columns: ["topic_name"]
            isOneToOne: false
            referencedRelation: "oewg_topics"
            referencedColumns: ["topic_name"]
          },
          {
            foreignKeyName: "oewg_ngrams_to_topic_names_topic_name_fkey"
            columns: ["topic_name"]
            isOneToOne: false
            referencedRelation: "vw_analysis_ai_labelled_topic_freq_by_community"
            referencedColumns: ["topic_name"]
          },
          {
            foreignKeyName: "oewg_ngrams_to_topic_names_topic_name_fkey"
            columns: ["topic_name"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["topic_name"]
          },
        ]
      }
      oewg_ngrams_to_use: {
        Row: {
          bcde_raised_more: string | null
          id: number
          is_filtered_out: boolean | null
          link_to_community_by_freq: string | null
          ngram: string
          p_value_ag_below_05: string | null
        }
        Insert: {
          bcde_raised_more?: string | null
          id?: number
          is_filtered_out?: boolean | null
          link_to_community_by_freq?: string | null
          ngram: string
          p_value_ag_below_05?: string | null
        }
        Update: {
          bcde_raised_more?: string | null
          id?: number
          is_filtered_out?: boolean | null
          link_to_community_by_freq?: string | null
          ngram?: string
          p_value_ag_below_05?: string | null
        }
        Relationships: []
      }
      oewg_topics: {
        Row: {
          bert_model_id: number | null
          bert_topic_num: number | null
          exclude: string | null
          include: string | null
          topic_group: string
          topic_id: string
          topic_name: string
          topic_short_description: string
        }
        Insert: {
          bert_model_id?: number | null
          bert_topic_num?: number | null
          exclude?: string | null
          include?: string | null
          topic_group: string
          topic_id: string
          topic_name: string
          topic_short_description: string
        }
        Update: {
          bert_model_id?: number | null
          bert_topic_num?: number | null
          exclude?: string | null
          include?: string | null
          topic_group?: string
          topic_id?: string
          topic_name?: string
          topic_short_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "oewg_topics_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_topic_ai_classification_pivoted: {
        Row: {
          id: number
          sentence_id: number
          topic_ids_json: string | null
        }
        Insert: {
          id?: number
          sentence_id: number
          topic_ids_json?: string | null
        }
        Update: {
          id?: number
          sentence_id?: number
          topic_ids_json?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sentence_topic_ai_classification_pivoted_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: true
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
        ]
      }
      sentence_topic_ai_classification_unpivoted: {
        Row: {
          sentence_id: number
          topic_id: string
        }
        Insert: {
          sentence_id: number
          topic_id: string
        }
        Update: {
          sentence_id?: number
          topic_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sentence_topic_ai_classification_unpivoted_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sentence_topic_ai_classification_unpivoted_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "oewg_topics"
            referencedColumns: ["topic_id"]
          },
          {
            foreignKeyName: "sentence_topic_ai_classification_unpivoted_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "vw_analysis_ai_labelled_topic_freq_by_community"
            referencedColumns: ["topic_id"]
          },
        ]
      }
      speech_sentence: {
        Row: {
          id: number
          intervention_id: number
          sentence_cleaned: string
          sentence_full: string
        }
        Insert: {
          id?: number
          intervention_id: number
          sentence_cleaned: string
          sentence_full: string
        }
        Update: {
          id?: number
          intervention_id?: number
          sentence_cleaned?: string
          sentence_full?: string
        }
        Relationships: [
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
        ]
      }
      user_settings: {
        Row: {
          id: number
          interventions_in_scope: string | null
          label_for_ngram_filtering_round: string | null
          ngram_frequency_cut_off: number | null
          ngram_length: number | null
        }
        Insert: {
          id?: number
          interventions_in_scope?: string | null
          label_for_ngram_filtering_round?: string | null
          ngram_frequency_cut_off?: number | null
          ngram_length?: number | null
        }
        Update: {
          id?: number
          interventions_in_scope?: string | null
          label_for_ngram_filtering_round?: string | null
          ngram_frequency_cut_off?: number | null
          ngram_length?: number | null
        }
        Relationships: []
      }
      wic_fellow_attendance_record: {
        Row: {
          attendance_at: string
          attendance_status: string
          fellow_iso: string
          oewg_session: number
          record_id: number
          sponsor_iso: string | null
          standardised_name: string | null
        }
        Insert: {
          attendance_at: string
          attendance_status: string
          fellow_iso: string
          oewg_session: number
          record_id: number
          sponsor_iso?: string | null
          standardised_name?: string | null
        }
        Update: {
          attendance_at?: string
          attendance_status?: string
          fellow_iso?: string
          oewg_session?: number
          record_id?: number
          sponsor_iso?: string | null
          standardised_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wic_fellow_attendance_record_fellow_iso_fkey"
            columns: ["fellow_iso"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wic_fellow_attendance_record_sponsor_iso_fkey"
            columns: ["sponsor_iso"]
            isOneToOne: false
            referencedRelation: "country"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      frequencydistributionofngrams: {
        Row: {
          cumulative_percentage: number | null
          cumulative_total: number | null
          frequency: number | null
          number_of_ngrams: number | null
        }
        Relationships: []
      }
      vw_analysis_ai_labelled_topic_freq_by_community: {
        Row: {
          a: number | null
          all_communities: number | null
          b: number | null
          c: number | null
          d: number | null
          e: number | null
          f: number | null
          g: number | null
          topic_group: string | null
          topic_id: string | null
          topic_name: string | null
          topic_short_description: string | null
        }
        Relationships: []
      }
      vw_analysis_bert_labelled_topic_freq_by_community: {
        Row: {
          a: number | null
          all_communities: number | null
          b: number | null
          c: number | null
          d: number | null
          e: number | null
          f: number | null
          g: number | null
          topic_group: string | null
          topic_id: number | null
          topic_name: string | null
          topic_short_description: string | null
        }
        Relationships: []
      }
      vw_avg_topic_prob_network_edges: {
        Row: {
          bert_model_id: number | null
          distance_metric: string | null
          distance_value: number | null
          similarity_weight: number | null
          speaker_1: string | null
          speaker_2: string | null
        }
        Insert: {
          bert_model_id?: number | null
          distance_metric?: string | null
          distance_value?: number | null
          similarity_weight?: never
          speaker_1?: string | null
          speaker_2?: string | null
        }
        Update: {
          bert_model_id?: number | null
          distance_metric?: string | null
          distance_value?: number | null
          similarity_weight?: never
          speaker_1?: string | null
          speaker_2?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bert_speaker_pairwise_distance_bert_model_id_fkey"
            columns: ["bert_model_id"]
            isOneToOne: false
            referencedRelation: "bert_models"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_avg_topic_prob_network_nodes: {
        Row: {
          bert_model_id: number | null
          speaker: string | null
        }
        Relationships: []
      }
      vw_country_ngram_sentence_counts: {
        Row: {
          count_sentences_for_ngram_by_country: number | null
          country_speaker: string | null
          ngram_id: number | null
          ngram_text: string | null
        }
        Relationships: []
      }
      vw_country_photos_to_take: {
        Row: {
          intervention_id: number | null
          speaker: string | null
          speaker_type: string | null
        }
        Relationships: []
      }
      vw_country_speaker_gender: {
        Row: {
          gender: string | null
          intervention_id: number | null
          speaker: string | null
          speaker_type: string | null
        }
        Relationships: []
      }
      vw_interventions_to_wic_fellow_or_not: {
        Row: {
          intervention_id: number | null
          likely_wic_fellow: number | null
        }
        Relationships: []
      }
      vw_lowest_rated_ngrams_for_review: {
        Row: {
          average_rating: number | null
          list_of_examples: string | null
          list_of_reasons: string | null
          ngram: string | null
          ngram_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
        ]
      }
      vw_ngram_sentence_samples: {
        Row: {
          ngram: string | null
          ngram_id: number | null
          sentence_full: string | null
          sentence_id: number | null
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_sentence_samples_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
        ]
      }
      vw_ngram_sentence_unpivoted: {
        Row: {
          intervention_id: number | null
          ngram: string | null
          ngram_id: number | null
          sentence_cleaned: string | null
          sentence_full: string | null
          sentence_id: number | null
          word_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "junc_sentence_id_to_ngram_id_sentence_id_fkey"
            columns: ["sentence_id"]
            isOneToOne: false
            referencedRelation: "speech_sentence"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "intervention"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_photos_to_take"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_country_speaker_gender"
            referencedColumns: ["intervention_id"]
          },
          {
            foreignKeyName: "speech_sentence_intervention_id_fkey"
            columns: ["intervention_id"]
            isOneToOne: false
            referencedRelation: "vw_interventions_to_wic_fellow_or_not"
            referencedColumns: ["intervention_id"]
          },
        ]
      }
      vw_ngram_usefulness_rating: {
        Row: {
          api_call_round: number | null
          ngram: string | null
          ngram_id: number | null
          rating: number | null
          rating_id: number | null
          reason: string | null
          source: string | null
        }
        Relationships: [
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "oewg_ngrams_to_use"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_country_ngram_sentence_counts"
            referencedColumns: ["ngram_id"]
          },
          {
            foreignKeyName: "oewg_ngram_usefulness_ai_rating_ngram_id_fkey"
            columns: ["ngram_id"]
            isOneToOne: false
            referencedRelation: "vw_ngrams_to_already_matched_topics"
            referencedColumns: ["ngram_id"]
          },
        ]
      }
      vw_ngrams_to_already_matched_topics: {
        Row: {
          cluster: number | null
          ngram: string | null
          ngram_id: number | null
          sample_sentences_concatenated: string | null
          topic_group: string | null
          topic_name: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
