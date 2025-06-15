
-- Drop the dependent view before altering the table
DROP VIEW IF EXISTS public.vw_avg_topic_prob_network_edges;

-- Increase precision for statistical columns to prevent 'out of range' errors.

-- Table: oewg_ngram_statistics
ALTER TABLE public.oewg_ngram_statistics
    ALTER COLUMN "relative_frequency_A" TYPE double precision,
    ALTER COLUMN "relative_frequency_BCDE" TYPE double precision,
    ALTER COLUMN "relative_frequency_F" TYPE double precision,
    ALTER COLUMN "relative_frequency_G" TYPE double precision,
    ALTER COLUMN "normalized_frequency_A" TYPE double precision,
    ALTER COLUMN "normalized_frequency_BCDE" TYPE double precision,
    ALTER COLUMN "normalized_frequency_F" TYPE double precision,
    ALTER COLUMN "normalized_frequency_G" TYPE double precision,
    ALTER COLUMN lor_polarization_score TYPE double precision,
    ALTER COLUMN p_value TYPE double precision;

-- Table: analysis_ai_labelled_topic_community_stats
ALTER TABLE public.analysis_ai_labelled_topic_community_stats
    ALTER COLUMN relative_frequency_a TYPE double precision,
    ALTER COLUMN relative_frequency_bcde TYPE double precision,
    ALTER COLUMN relative_frequency_f TYPE double precision,
    ALTER COLUMN relative_frequency_g TYPE double precision,
    ALTER COLUMN normalized_frequency_a TYPE double precision,
    ALTER COLUMN normalized_frequency_bcde TYPE double precision,
    ALTER COLUMN normalized_frequency_f TYPE double precision,
    ALTER COLUMN normalized_frequency_g TYPE double precision,
    ALTER COLUMN dif_bcde_to_highest_polar TYPE double precision,
    ALTER COLUMN dif_bcde_to_mid_polar_point TYPE double precision,
    ALTER COLUMN lor_polarization_score TYPE double precision,
    ALTER COLUMN focus_polarization_score TYPE double precision,
    ALTER COLUMN p_value_ag TYPE double precision;

-- Table: analysis_bert_labelled_topic_community_stats
ALTER TABLE public.analysis_bert_labelled_topic_community_stats
    ALTER COLUMN relative_frequency_a TYPE double precision,
    ALTER COLUMN relative_frequency_bcde TYPE double precision,
    ALTER COLUMN relative_frequency_f TYPE double precision,
    ALTER COLUMN relative_frequency_g TYPE double precision,
    ALTER COLUMN normalized_frequency_a TYPE double precision,
    ALTER COLUMN normalized_frequency_bcde TYPE double precision,
    ALTER COLUMN normalized_frequency_f TYPE double precision,
    ALTER COLUMN normalized_frequency_g TYPE double precision,
    ALTER COLUMN dif_bcde_to_highest_polar TYPE double precision,
    ALTER COLUMN dif_bcde_to_mid_polar_point TYPE double precision,
    ALTER COLUMN lor_polarization_score TYPE double precision,
    ALTER COLUMN focus_polarization_score TYPE double precision,
    ALTER COLUMN p_value_ag TYPE double precision;

-- Table: analysis_ngram_clustering_silhouette_by_sentence
ALTER TABLE public.analysis_ngram_clustering_silhouette_by_sentence
    ALTER COLUMN optimal_silhouette_score TYPE double precision;

-- Table: analysis_ngram_community_stats
ALTER TABLE public.analysis_ngram_community_stats
    ALTER COLUMN relative_frequency_a TYPE double precision,
    ALTER COLUMN relative_frequency_bcde TYPE double precision,
    ALTER COLUMN relative_frequency_f TYPE double precision,
    ALTER COLUMN relative_frequency_g TYPE double precision,
    ALTER COLUMN normalized_frequency_a TYPE double precision,
    ALTER COLUMN normalized_frequency_bcde TYPE double precision,
    ALTER COLUMN normalized_frequency_f TYPE double precision,
    ALTER COLUMN normalized_frequency_g TYPE double precision,
    ALTER COLUMN dif_bcde_to_highest_polar TYPE double precision,
    ALTER COLUMN dif_bcde_to_mid_polar_point TYPE double precision,
    ALTER COLUMN lor_polarization_score TYPE double precision,
    ALTER COLUMN focus_polarization_score TYPE double precision,
    ALTER COLUMN p_value_ag TYPE double precision;

-- Table: bert_speaker_avg_topic_probability
ALTER TABLE public.bert_speaker_avg_topic_probability
    ALTER COLUMN average_probability TYPE double precision;

-- Table: bert_speaker_pairwise_distance
ALTER TABLE public.bert_speaker_pairwise_distance
    ALTER COLUMN distance_value TYPE double precision;

-- Table: bert_topic_keywords
ALTER TABLE public.bert_topic_keywords
    ALTER COLUMN bert_keyword_score TYPE double precision;

-- Recreate the view with the updated column type
CREATE OR REPLACE VIEW public.vw_avg_topic_prob_network_edges AS
SELECT
    bert_model_id,
    speaker_1,
    speaker_2,
    distance_metric,
    distance_value,
    (1.0 / (1.0 + distance_value)) AS similarity_weight
FROM public.bert_speaker_pairwise_distance;

-- Clear all data from the tables for a fresh migration run
TRUNCATE TABLE
    public.bert_models,
    public.country,
    public.intervention,
    public.oewg_ngram_filter_phrases,
    public.oewg_ngrams_to_use,
    public.oewg_ngram_statistics,
    public.oewg_ngram_community_frequencies,
    public.oewg_ngram_cluster_from_shared_sentences,
    public.user_settings,
    public.bert_topic_definition,
    public.oewg_topics,
    public.speech_sentence,
    public.wic_fellow_attendance_record,
    public.intervention_cleaned_words,
    public.intervention_photo,
    public.intervention_alternative_gender_source,
    public.analysis_ngram_community_stats,
    public.oewg_ngram_usefulness_ai_rating,
    public.analysis_ngram_clustering_silhouette_by_sentence,
    public.bert_speaker_pairwise_distance,
    public.oewg_ngrams_to_topic_names,
    public.analysis_ai_labelled_topic_community_stats,
    public.sentence_topic_ai_classification_pivoted,
    public.junc_sentence_id_to_ngram_id,
    public.analysis_bert_labelled_topic_community_stats,
    public.bert_speaker_avg_topic_probability,
    public.bert_topic_keywords,
    public.oewg_ngram_sentence_samples,
    public.sentence_topic_ai_classification_unpivoted,
    public.bert_sentence_topic_probabilities
RESTART IDENTITY CASCADE;
