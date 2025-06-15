
-- Step 1: Clear all data from the tables for a fresh migration
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

-- Step 2: Drop the dependent view to allow table modification
DROP VIEW IF EXISTS public.vw_analysis_bert_labelled_topic_freq_by_community;

-- Step 3: Alter the column type to handle very small decimal values
ALTER TABLE public.bert_sentence_topic_probabilities
ALTER COLUMN bert_probability_score TYPE DOUBLE PRECISION;

-- Step 4: Recreate the view with the original definition
CREATE OR REPLACE VIEW public.vw_analysis_bert_labelled_topic_freq_by_community AS
WITH SentenceCommunityBertTopics AS (
    SELECT
        bstp.bert_topic_id AS topic_id,
        c.cpm_community_after_10_CPM_0_53 AS community,
        bstp.bert_model_id
    FROM public.bert_sentence_topic_probabilities bstp
    JOIN public.speech_sentence ss ON bstp.sentence_id = ss.id
    JOIN public.intervention i ON ss.intervention_id = i.id
    JOIN public.country c ON i.speaker = c.id
    WHERE i.speaker_type = 'country'
      AND bstp.bert_topic_rank = 1
      AND bstp.bert_topic_id != -1
      AND bstp.bert_probability_score >= 0.3
),
BertTopicCommunityCounts AS (
    SELECT
        sct.topic_id,
        sct.bert_model_id,
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_A,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_B,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_C,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_D,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_E,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_F,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_G,
        COUNT(*) AS count_all
    FROM SentenceCommunityBertTopics sct
    GROUP BY sct.topic_id, sct.bert_model_id
)
SELECT
    btd.bert_topic_id AS topic_id,
    COALESCE(btd.bert_topic_name_custom, btd.bert_topic_name_default) AS topic_name,
    COALESCE(btd.bert_topic_name_custom, btd.bert_topic_name_default) AS topic_short_description,
    CAST(btd.bert_model_id AS TEXT) AS topic_group,
    COALESCE(btcc.count_A, 0) AS A,
    COALESCE(btcc.count_B, 0) AS B,
    COALESCE(btcc.count_C, 0) AS C,
    COALESCE(btcc.count_D, 0) AS D,
    COALESCE(btcc.count_E, 0) AS E,
    COALESCE(btcc.count_F, 0) AS F,
    COALESCE(btcc.count_G, 0) AS G,
    COALESCE(btcc.count_all, 0) AS all_communities
FROM public.bert_topic_definition btd
LEFT JOIN BertTopicCommunityCounts btcc ON btd.bert_topic_id = btcc.topic_id AND btd.bert_model_id = btcc.bert_model_id
WHERE btd.bert_topic_id != -1
ORDER BY all_communities DESC;
