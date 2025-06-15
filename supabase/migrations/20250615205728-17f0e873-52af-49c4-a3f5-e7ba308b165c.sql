
-- Step 1: Drop dependent views to allow table modification
DROP VIEW IF EXISTS public.vw_analysis_bert_labelled_topic_freq_by_community;
DROP VIEW IF EXISTS public.vw_analysis_ai_labelled_topic_freq_by_community;

-- Step 2: Rename the column in the country table to match the case from the legacy schema.
-- The double quotes are essential to preserve the case.
ALTER TABLE public.country
RENAME COLUMN cpm_community_after_10_cpm_0_53 TO "cpm_community_after_10_CPM_0_53";

-- Step 3: Recreate the views with the corrected, case-sensitive column name.

-- Recreate vw_analysis_ai_labelled_topic_freq_by_community
CREATE OR REPLACE VIEW public.vw_analysis_ai_labelled_topic_freq_by_community AS
WITH sentence_community_ai_topics AS (
    SELECT
        stac.topic_id,
        c."cpm_community_after_10_CPM_0_53" AS community
    FROM
        public.sentence_topic_ai_classification_unpivoted stac
        JOIN public.speech_sentence ss ON stac.sentence_id = ss.id
        JOIN public.intervention i ON ss.intervention_id = i.id
        JOIN public.country c ON i.speaker = c.id
    WHERE
        i.speaker_type = 'country' AND stac.topic_id IS NOT NULL
),
ai_topic_community_counts AS (
    SELECT
        sct.topic_id,
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_a,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_b,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_c,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_d,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_e,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_f,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_g,
        COUNT(*) AS count_all_communities
    FROM
        sentence_community_ai_topics sct
    GROUP BY
        sct.topic_id
)
SELECT
    ot.topic_id,
    ot.topic_name,
    ot.topic_short_description,
    ot.topic_group,
    COALESCE(atcc.count_a, 0) AS a,
    COALESCE(atcc.count_b, 0) AS b,
    COALESCE(atcc.count_c, 0) AS c,
    COALESCE(atcc.count_d, 0) AS d,
    COALESCE(atcc.count_e, 0) AS e,
    COALESCE(atcc.count_f, 0) AS f,
    COALESCE(atcc.count_g, 0) AS g,
    COALESCE(atcc.count_all_communities, 0) AS all_communities
FROM
    public.oewg_topics ot
LEFT JOIN
    ai_topic_community_counts atcc ON ot.topic_id = atcc.topic_id
ORDER BY
    ot.topic_id;

-- Recreate vw_analysis_bert_labelled_topic_freq_by_community
CREATE OR REPLACE VIEW public.vw_analysis_bert_labelled_topic_freq_by_community AS
WITH SentenceCommunityBertTopics AS (
    SELECT
        bstp.bert_topic_id AS topic_id,
        c."cpm_community_after_10_CPM_0_53" AS community,
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
