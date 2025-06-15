
-- Comprehensive Supabase Schema Setup
-- This script drops the initial, incomplete tables and recreates the full schema
-- from the legacy `oewg_analysis_dash.db` to support the entire application.

-- ========= Step 1: Drop Old Tables =========
-- Remove the previously created tables to start with a clean slate.
DROP TABLE IF EXISTS public.speech_sentences CASCADE;
DROP TABLE IF EXISTS public.ngram_statistics CASCADE;
DROP TABLE IF EXISTS public.interventions CASCADE;
DROP TABLE IF EXISTS public.countries CASCADE;

-- ========= Step 2: Create All Legacy Tables =========
-- The following CREATE TABLE statements are based on the schema defined in
-- `legacy/ngram_ternary_chart/src/models/db_models.py`.

-- Table: bert_models
CREATE TABLE IF NOT EXISTS public.bert_models (
    id SERIAL PRIMARY KEY,
    model_identifier TEXT NOT NULL UNIQUE,
    description TEXT
);
CREATE INDEX IF NOT EXISTS ix_bert_models_model_identifier ON public.bert_models(model_identifier);

-- Table: country
CREATE TABLE IF NOT EXISTS public.country (
    id TEXT PRIMARY KEY,
    merge_name TEXT,
    morgus_30_swing_states TEXT,
    cpm_cluster_after_10_res_0_53 INTEGER,
    cpm_community_after_10_CPM_0_53 TEXT,
    merge_name_with_pat_10 TEXT,
    pat_10 INTEGER
);

-- Table: intervention
CREATE TABLE IF NOT EXISTS public.intervention (
    id INTEGER PRIMARY KEY,
    meeting TEXT,
    session_number INTEGER,
    meeting_number INTEGER,
    within_meeting_index INTEGER,
    agenda_item TEXT,
    speaker TEXT,
    speaker_type TEXT,
    timestamp_start_hhmmss TIME,
    timestamp_end_hhmmss TIME,
    url_for_video TEXT,
    speech TEXT,
    apr_negotiation_round TEXT
);

-- Table: oewg_ngrams_to_use
CREATE TABLE IF NOT EXISTS public.oewg_ngrams_to_use (
    id SERIAL PRIMARY KEY,
    ngram TEXT NOT NULL,
    p_value_ag_below_05 TEXT,
    bcde_raised_more TEXT,
    link_to_community_by_freq TEXT,
    is_filtered_out BOOLEAN DEFAULT FALSE
);

-- Table: bert_topic_definition
CREATE TABLE IF NOT EXISTS public.bert_topic_definition (
    bert_topic_id INTEGER PRIMARY KEY,
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    bert_topic_name_default TEXT,
    bert_topic_name_custom TEXT
);
CREATE INDEX IF NOT EXISTS ix_bert_topic_definition_bert_model_id ON public.bert_topic_definition(bert_model_id);

-- Table: oewg_topics
CREATE TABLE IF NOT EXISTS public.oewg_topics (
    topic_id TEXT PRIMARY KEY,
    topic_short_description TEXT NOT NULL,
    topic_name TEXT NOT NULL UNIQUE,
    topic_group TEXT NOT NULL,
    bert_topic_num INTEGER,
    bert_model_id INTEGER REFERENCES public.bert_models(id),
    include TEXT,
    exclude TEXT
);
CREATE INDEX IF NOT EXISTS ix_oewg_topics_bert_model_id ON public.oewg_topics(bert_model_id);

-- Table: speech_sentence
CREATE TABLE IF NOT EXISTS public.speech_sentence (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER NOT NULL REFERENCES public.intervention(id),
    sentence_full TEXT NOT NULL,
    sentence_cleaned TEXT NOT NULL
);

-- Table: wic_fellow_attendance_record
CREATE TABLE IF NOT EXISTS public.wic_fellow_attendance_record (
    record_id INTEGER PRIMARY KEY,
    fellow_iso TEXT NOT NULL REFERENCES public.country(id),
    standardised_name TEXT,
    oewg_session INTEGER NOT NULL,
    sponsor_iso TEXT REFERENCES public.country(id),
    attendance_at TEXT NOT NULL,
    attendance_status TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS ix_wic_fellow_attendance_record_fellow_iso ON public.wic_fellow_attendance_record(fellow_iso);
CREATE INDEX IF NOT EXISTS ix_wic_fellow_attendance_record_sponsor_iso ON public.wic_fellow_attendance_record(sponsor_iso);

-- Table: intervention_cleaned_words
CREATE TABLE IF NOT EXISTS public.intervention_cleaned_words (
    intervention_id INTEGER PRIMARY KEY REFERENCES public.intervention(id),
    cleaned_words_only_text TEXT
);

-- Table: intervention_photo
CREATE TABLE IF NOT EXISTS public.intervention_photo (
    id TEXT PRIMARY KEY,
    intervention_id INTEGER NOT NULL REFERENCES public.intervention(id),
    able_to_take_photo BOOLEAN,
    photo_filename TEXT,
    gender_from_photo TEXT,
    url_video_at_photo TEXT
);
CREATE INDEX IF NOT EXISTS ix_intervention_photo_intervention_id ON public.intervention_photo(intervention_id);

-- Table: intervention_alternative_gender_source
CREATE TABLE IF NOT EXISTS public.intervention_alternative_gender_source (
    intervention_id INTEGER PRIMARY KEY REFERENCES public.intervention(id),
    gender_not_from_photo TEXT,
    notes TEXT
);

-- Table: oewg_ngram_filter_phrases
CREATE TABLE IF NOT EXISTS public.oewg_ngram_filter_phrases (
    filter_phrase TEXT PRIMARY KEY,
    reason TEXT,
    number_of_words INTEGER,
    from_which_round TEXT
);

-- Table: oewg_ngram_community_frequencies
CREATE TABLE IF NOT EXISTS public.oewg_ngram_community_frequencies (
    ngram TEXT NOT NULL,
    community TEXT NOT NULL,
    frequency INTEGER NOT NULL,
    PRIMARY KEY (ngram, community)
);

-- Table: oewg_ngram_statistics
CREATE TABLE IF NOT EXISTS public.oewg_ngram_statistics (
    ngram TEXT PRIMARY KEY,
    count_A INTEGER NOT NULL DEFAULT 0,
    count_BCDE INTEGER NOT NULL DEFAULT 0,
    count_F INTEGER NOT NULL DEFAULT 0,
    count_G INTEGER NOT NULL DEFAULT 0,
    count_all_communities INTEGER NOT NULL DEFAULT 0,
    relative_frequency_A REAL NOT NULL DEFAULT 0.0,
    relative_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    relative_frequency_F REAL NOT NULL DEFAULT 0.0,
    relative_frequency_G REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_A REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_F REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_G REAL NOT NULL DEFAULT 0.0,
    lor_polarization_score REAL,
    p_value REAL,
    p_value_ag_below_05 TEXT,
    bcde_raised_more TEXT
);

-- Table: oewg_ngram_sentence_samples
CREATE TABLE IF NOT EXISTS public.oewg_ngram_sentence_samples (
    ngram_id INTEGER NOT NULL REFERENCES public.oewg_ngrams_to_use(id),
    sentence_id INTEGER NOT NULL REFERENCES public.speech_sentence(id),
    PRIMARY KEY (ngram_id, sentence_id)
);

-- Table: oewg_ngrams_to_topic_names
CREATE TABLE IF NOT EXISTS public.oewg_ngrams_to_topic_names (
    ngram TEXT NOT NULL,
    topic_name TEXT NOT NULL REFERENCES public.oewg_topics(topic_name),
    coder TEXT NOT NULL,
    PRIMARY KEY (ngram, topic_name)
);

-- Table: junc_sentence_id_to_ngram_id
CREATE TABLE IF NOT EXISTS public.junc_sentence_id_to_ngram_id (
    sentence_id INTEGER NOT NULL REFERENCES public.speech_sentence(id),
    ngram_id INTEGER NOT NULL REFERENCES public.oewg_ngrams_to_use(id),
    PRIMARY KEY (sentence_id, ngram_id)
);

-- Table: oewg_ngram_usefulness_ai_rating
CREATE TABLE IF NOT EXISTS public.oewg_ngram_usefulness_ai_rating (
    rating_id SERIAL PRIMARY KEY,
    ngram_id INTEGER NOT NULL REFERENCES public.oewg_ngrams_to_use(id),
    rating INTEGER NOT NULL,
    reason TEXT,
    api_call_round INTEGER,
    source TEXT NOT NULL
);

-- Table: oewg_ngram_cluster_from_shared_sentences
CREATE TABLE IF NOT EXISTS public.oewg_ngram_cluster_from_shared_sentences (
    ngram_id INTEGER PRIMARY KEY,
    ngram_cluster_from_ss INTEGER NOT NULL
);

-- Table: analysis_ngram_clustering_silhouette_by_sentence
CREATE TABLE IF NOT EXISTS public.analysis_ngram_clustering_silhouette_by_sentence (
    id SERIAL PRIMARY KEY,
    ngram_id INTEGER NOT NULL REFERENCES public.oewg_ngrams_to_use(id),
    ngram TEXT,
    cluster INTEGER NOT NULL,
    optimal_clusters INTEGER,
    optimal_silhouette_score REAL
);
CREATE INDEX IF NOT EXISTS ix_analysis_ngram_clustering_silhouette_by_sentence_ngram_id ON public.analysis_ngram_clustering_silhouette_by_sentence(ngram_id);

-- Table: analysis_ai_labelled_topic_community_stats
CREATE TABLE IF NOT EXISTS public.analysis_ai_labelled_topic_community_stats (
    topic_id TEXT PRIMARY KEY REFERENCES public.oewg_topics(topic_id),
    topic_short_description TEXT,
    count_A INTEGER NOT NULL DEFAULT 0,
    count_BCDE INTEGER NOT NULL DEFAULT 0,
    count_F INTEGER NOT NULL DEFAULT 0,
    count_G INTEGER NOT NULL DEFAULT 0,
    count_all_communities INTEGER NOT NULL DEFAULT 0,
    relative_frequency_A REAL NOT NULL DEFAULT 0.0,
    relative_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    relative_frequency_F REAL NOT NULL DEFAULT 0.0,
    relative_frequency_G REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_A REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_F REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_G REAL NOT NULL DEFAULT 0.0,
    dif_bcde_to_highest_polar REAL,
    dif_bcde_to_mid_polar_point REAL,
    lor_polarization_score REAL,
    focus_polarization_score REAL,
    p_value_ag REAL
);

-- Table: analysis_bert_labelled_topic_community_stats
CREATE TABLE IF NOT EXISTS public.analysis_bert_labelled_topic_community_stats (
    topic_id INTEGER NOT NULL REFERENCES public.bert_topic_definition(bert_topic_id),
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    topic_short_description TEXT,
    count_A INTEGER NOT NULL DEFAULT 0,
    count_BCDE INTEGER NOT NULL DEFAULT 0,
    count_F INTEGER NOT NULL DEFAULT 0,
    count_G INTEGER NOT NULL DEFAULT 0,
    count_all_communities INTEGER NOT NULL DEFAULT 0,
    relative_frequency_A REAL NOT NULL DEFAULT 0.0,
    relative_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    relative_frequency_F REAL NOT NULL DEFAULT 0.0,
    relative_frequency_G REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_A REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_F REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_G REAL NOT NULL DEFAULT 0.0,
    dif_bcde_to_highest_polar REAL,
    dif_bcde_to_mid_polar_point REAL,
    lor_polarization_score REAL,
    focus_polarization_score REAL,
    p_value_ag REAL,
    PRIMARY KEY (topic_id, bert_model_id)
);

-- Table: analysis_ngram_community_stats
CREATE TABLE IF NOT EXISTS public.analysis_ngram_community_stats (
    ngram_id INTEGER PRIMARY KEY REFERENCES public.oewg_ngrams_to_use(id),
    ngram TEXT,
    count_A INTEGER NOT NULL DEFAULT 0,
    count_BCDE INTEGER NOT NULL DEFAULT 0,
    count_F INTEGER NOT NULL DEFAULT 0,
    count_G INTEGER NOT NULL DEFAULT 0,
    count_all_communities INTEGER NOT NULL DEFAULT 0,
    relative_frequency_A REAL NOT NULL DEFAULT 0.0,
    relative_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    relative_frequency_F REAL NOT NULL DEFAULT 0.0,
    relative_frequency_G REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_A REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_BCDE REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_F REAL NOT NULL DEFAULT 0.0,
    normalized_frequency_G REAL NOT NULL DEFAULT 0.0,
    dif_bcde_to_highest_polar REAL,
    dif_bcde_to_mid_polar_point REAL,
    lor_polarization_score REAL,
    focus_polarization_score REAL,
    p_value_ag REAL
);

-- Table: sentence_topic_ai_classification_pivoted
CREATE TABLE IF NOT EXISTS public.sentence_topic_ai_classification_pivoted (
    id SERIAL PRIMARY KEY,
    sentence_id INTEGER NOT NULL UNIQUE REFERENCES public.speech_sentence(id),
    topic_ids_json TEXT
);
CREATE INDEX IF NOT EXISTS ix_sentence_topic_ai_classification_pivoted_sentence_id ON public.sentence_topic_ai_classification_pivoted(sentence_id);

-- Table: sentence_topic_ai_classification_unpivoted
CREATE TABLE IF NOT EXISTS public.sentence_topic_ai_classification_unpivoted (
    sentence_id INTEGER NOT NULL REFERENCES public.speech_sentence(id),
    topic_id TEXT NOT NULL REFERENCES public.oewg_topics(topic_id),
    PRIMARY KEY (sentence_id, topic_id)
);

-- Table: bert_speaker_avg_topic_probability
CREATE TABLE IF NOT EXISTS public.bert_speaker_avg_topic_probability (
    speaker TEXT NOT NULL,
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    bert_topic_id INTEGER NOT NULL REFERENCES public.bert_topic_definition(bert_topic_id),
    average_probability REAL NOT NULL,
    PRIMARY KEY (speaker, bert_model_id, bert_topic_id)
);
CREATE INDEX IF NOT EXISTS ix_bert_speaker_avg_topic_probability_speaker ON public.bert_speaker_avg_topic_probability(speaker);
CREATE INDEX IF NOT EXISTS ix_bert_speaker_avg_topic_probability_bert_model_id ON public.bert_speaker_avg_topic_probability(bert_model_id);
CREATE INDEX IF NOT EXISTS ix_bert_speaker_avg_topic_probability_bert_topic_id ON public.bert_speaker_avg_topic_probability(bert_topic_id);

-- Table: bert_speaker_pairwise_distance
CREATE TABLE IF NOT EXISTS public.bert_speaker_pairwise_distance (
    speaker_1 TEXT NOT NULL,
    speaker_2 TEXT NOT NULL,
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    distance_metric TEXT NOT NULL,
    distance_value REAL NOT NULL,
    PRIMARY KEY (speaker_1, speaker_2, bert_model_id, distance_metric),
    CHECK (speaker_1 < speaker_2)
);
CREATE INDEX IF NOT EXISTS ix_speaker_pairwise_dist_model_metric ON public.bert_speaker_pairwise_distance(bert_model_id, distance_metric);
CREATE INDEX IF NOT EXISTS ix_bert_speaker_pairwise_distance_speaker_1 ON public.bert_speaker_pairwise_distance(speaker_1);
CREATE INDEX IF NOT EXISTS ix_bert_speaker_pairwise_distance_speaker_2 ON public.bert_speaker_pairwise_distance(speaker_2);

-- Table: bert_topic_keywords
CREATE TABLE IF NOT EXISTS public.bert_topic_keywords (
    bert_topic_id INTEGER NOT NULL REFERENCES public.bert_topic_definition(bert_topic_id),
    bert_keyword_rank INTEGER NOT NULL,
    bert_keyword TEXT NOT NULL,
    bert_keyword_score REAL NOT NULL,
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    PRIMARY KEY (bert_topic_id, bert_keyword_rank)
);
CREATE INDEX IF NOT EXISTS ix_bert_topic_keywords_model_id ON public.bert_topic_keywords(bert_model_id);

-- Table: bert_sentence_topic_probabilities
CREATE TABLE IF NOT EXISTS public.bert_sentence_topic_probabilities (
    sentence_id INTEGER NOT NULL REFERENCES public.speech_sentence(id),
    bert_topic_rank INTEGER NOT NULL,
    intervention_id INTEGER NOT NULL REFERENCES public.intervention(id),
    bert_topic_id INTEGER NOT NULL REFERENCES public.bert_topic_definition(bert_topic_id),
    bert_probability_score REAL NOT NULL,
    bert_model_id INTEGER NOT NULL REFERENCES public.bert_models(id),
    prediction_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (sentence_id, bert_topic_rank)
);
CREATE INDEX IF NOT EXISTS ix_bert_sentence_topic_probabilities_intervention_id ON public.bert_sentence_topic_probabilities(intervention_id);
CREATE INDEX IF NOT EXISTS ix_bert_sentence_topic_probabilities_bert_topic_id ON public.bert_sentence_topic_probabilities(bert_topic_id);
CREATE INDEX IF NOT EXISTS ix_bert_sentence_topic_probabilities_bert_model_id ON public.bert_sentence_topic_probabilities(bert_model_id);

-- Table: user_settings
CREATE TABLE IF NOT EXISTS public.user_settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    interventions_in_scope TEXT,
    ngram_frequency_cut_off INTEGER,
    ngram_length INTEGER,
    label_for_ngram_filtering_round TEXT,
    CHECK (id = 1)
);


-- ========= Step 3: Create All Legacy Views =========
-- The following CREATE VIEW statements are based on the views defined in
-- `legacy/ngram_ternary_chart/src/models/db_models.py`.
-- Table names have been updated to match the tables created above.

CREATE OR REPLACE VIEW public.vw_country_ngram_sentence_counts AS
SELECT
    i.speaker AS country_speaker,
    ntu.id AS ngram_id,
    ntu.ngram AS ngram_text,
    COUNT(DISTINCT j.sentence_id) AS count_sentences_for_ngram_by_country
FROM
    public.intervention i
JOIN
    public.speech_sentence ss ON i.id = ss.intervention_id
JOIN
    public.junc_sentence_id_to_ngram_id j ON ss.id = j.sentence_id
JOIN
    public.oewg_ngrams_to_use ntu ON j.ngram_id = ntu.id
WHERE
    i.speaker_type = 'country'
    AND i.speaker != 'PSE'
    AND ntu.is_filtered_out = FALSE
GROUP BY
    i.speaker,
    ntu.id,
    ntu.ngram;

CREATE OR REPLACE VIEW public.FrequencyDistributionOfNgrams AS
WITH freq_counts AS (
    SELECT s.count_all_communities AS frequency
    FROM public.oewg_ngram_statistics AS s
),
summaries AS (
    SELECT
        frequency,
        COUNT(*) AS number_of_ngrams
    FROM freq_counts
    GROUP BY frequency
),
grand_total AS (
    SELECT SUM(number_of_ngrams) AS sum_ngrams
    FROM summaries
),
cumulative_calc AS (
    SELECT
        s1.frequency,
        s1.number_of_ngrams,
        (
            SELECT SUM(s2.number_of_ngrams)
            FROM summaries s2
            WHERE s2.frequency >= s1.frequency
        ) AS cumulative_total
    FROM summaries s1
)
SELECT
    c.frequency,
    c.number_of_ngrams,
    c.cumulative_total,
    CAST(c.cumulative_total AS REAL)/gt.sum_ngrams*100 AS cumulative_percentage
FROM cumulative_calc c
CROSS JOIN grand_total gt
ORDER BY frequency DESC;

CREATE OR REPLACE VIEW public.vw_ngram_sentence_samples AS
SELECT
    s.ngram_id,
    s.sentence_id,
    n.ngram,
    ss.sentence_full
FROM public.oewg_ngram_sentence_samples s
JOIN public.oewg_ngrams_to_use n ON s.ngram_id = n.id
JOIN public.speech_sentence ss ON s.sentence_id = ss.id;

CREATE OR REPLACE VIEW public.vw_ngram_usefulness_rating AS
SELECT 
    r.rating_id,
    r.ngram_id,
    n.ngram,
    r.rating,
    r.reason,
    r.api_call_round,
    r.source
FROM public.oewg_ngram_usefulness_ai_rating r
JOIN public.oewg_ngrams_to_use n ON r.ngram_id = n.id;

CREATE OR REPLACE VIEW public.vw_lowest_rated_ngrams_for_review AS
SELECT
    r.ngram_id,
    n.ngram,
    ROUND(AVG(r.rating), 2) AS average_rating,
    (
        SELECT string_agg(sentence_full, '|||')
        FROM public.vw_ngram_sentence_samples
        WHERE ngram_id = r.ngram_id
    ) AS list_of_examples,
    string_agg(r.reason, '|||') AS list_of_reasons
FROM public.oewg_ngram_usefulness_ai_rating r
JOIN public.oewg_ngrams_to_use n ON n.id = r.ngram_id
GROUP BY r.ngram_id, n.ngram
HAVING SUM(CASE WHEN r.rating <= 3 THEN 1 ELSE 0 END) >= 2;

CREATE OR REPLACE VIEW public.vw_ngrams_to_already_matched_topics AS
SELECT
    n.id AS ngram_id,
    ca.ngram_cluster_from_ss AS cluster,
    n.ngram,
    t.topic_name,
    t.topic_group,
    (
        SELECT string_agg(ss.sentence_full, ' | ')
        FROM public.oewg_ngram_sentence_samples ognss
        JOIN public.speech_sentence ss ON ognss.sentence_id = ss.id
        WHERE ognss.ngram_id = n.id
    ) AS sample_sentences_concatenated
FROM
    public.oewg_ngrams_to_use n
LEFT JOIN
    public.oewg_ngram_cluster_from_shared_sentences ca ON ca.ngram_id = n.id
LEFT JOIN
    public.oewg_ngrams_to_topic_names j ON n.ngram = j.ngram
LEFT JOIN
    public.oewg_topics t ON j.topic_name = t.topic_name
WHERE
    n.is_filtered_out = FALSE;

CREATE OR REPLACE VIEW public.vw_country_speaker_gender AS
SELECT
    i.id AS intervention_id,
    i.speaker,
    i.speaker_type,
    COALESCE(
        ip.gender_from_photo,
        iags.gender_not_from_photo,
        '*** GENDER DATA MISSING ***'
    ) AS gender
FROM
    public.intervention i
LEFT JOIN
    public.intervention_photo ip ON i.id = ip.intervention_id
LEFT JOIN
    public.intervention_alternative_gender_source iags ON i.id = iags.intervention_id
WHERE
    i.speaker_type = 'country';

CREATE OR REPLACE VIEW public.vw_country_photos_to_take AS
SELECT
    i.id AS intervention_id,
    i.speaker,
    i.speaker_type
FROM
    public.intervention i
LEFT JOIN
    public.intervention_photo ip ON i.id = ip.intervention_id
WHERE
    ip.intervention_id IS NULL
    AND i.speaker_type = 'country';

CREATE OR REPLACE VIEW public.vw_interventions_to_wic_fellow_or_not AS
SELECT
    i.id AS intervention_id,
    CASE
        WHEN i.speaker_type != 'country' THEN 0
        WHEN csg.gender = 'female' AND EXISTS (
            SELECT 1
            FROM public.wic_fellow_attendance_record wfar
            WHERE wfar.fellow_iso = i.speaker
              AND wfar.oewg_session = i.session_number
              AND wfar.attendance_at = 'session'
              AND wfar.attendance_status = 'Yes'
        ) THEN 1
        ELSE 0
    END AS likely_wic_fellow
FROM
    public.intervention i
LEFT JOIN
    public.vw_country_speaker_gender csg ON i.id = csg.intervention_id;

CREATE OR REPLACE VIEW public.vw_ngram_sentence_unpivoted AS
SELECT
    j.ngram_id,
    n.ngram,
    j.sentence_id,
    s.intervention_id,
    s.sentence_full,
    s.sentence_cleaned,
    (LENGTH(TRIM(s.sentence_cleaned)) - LENGTH(REPLACE(TRIM(s.sentence_cleaned), ' ', '')) + 1) AS word_count
FROM
    public.junc_sentence_id_to_ngram_id j
JOIN
    public.oewg_ngrams_to_use n ON j.ngram_id = n.id
JOIN
    public.speech_sentence s ON j.sentence_id = s.id;

CREATE OR REPLACE VIEW public.vw_analysis_ai_labelled_topic_freq_by_community AS
WITH SentenceCommunityTopics AS (
    SELECT
        stacu.topic_id,
        c.cpm_community_after_10_CPM_0_53 AS community
    FROM public.sentence_topic_ai_classification_unpivoted stacu
    JOIN public.speech_sentence ss ON stacu.sentence_id = ss.id
    JOIN public.intervention i ON ss.intervention_id = i.id
    JOIN public.country c ON i.speaker = c.id
    WHERE i.speaker_type = 'country'
),
TopicCommunityCounts AS (
    SELECT
        sct.topic_id,
        SUM(CASE WHEN sct.community = 'A' THEN 1 ELSE 0 END) AS count_A,
        SUM(CASE WHEN sct.community = 'B' THEN 1 ELSE 0 END) AS count_B,
        SUM(CASE WHEN sct.community = 'C' THEN 1 ELSE 0 END) AS count_C,
        SUM(CASE WHEN sct.community = 'D' THEN 1 ELSE 0 END) AS count_D,
        SUM(CASE WHEN sct.community = 'E' THEN 1 ELSE 0 END) AS count_E,
        SUM(CASE WHEN sct.community = 'F' THEN 1 ELSE 0 END) AS count_F,
        SUM(CASE WHEN sct.community = 'G' THEN 1 ELSE 0 END) AS count_G,
        COUNT(*) AS count_all
    FROM SentenceCommunityTopics sct
    GROUP BY sct.topic_id
)
SELECT
    t.topic_id,
    t.topic_name,
    t.topic_short_description,
    t.topic_group,
    COALESCE(tcc.count_A, 0) AS A,
    COALESCE(tcc.count_B, 0) AS B,
    COALESCE(tcc.count_C, 0) AS C,
    COALESCE(tcc.count_D, 0) AS D,
    COALESCE(tcc.count_E, 0) AS E,
    COALESCE(tcc.count_F, 0) AS F,
    COALESCE(tcc.count_G, 0) AS G,
    COALESCE(tcc.count_all, 0) AS all_communities
FROM public.oewg_topics t
LEFT JOIN TopicCommunityCounts tcc ON t.topic_id = tcc.topic_id
ORDER BY all_communities DESC;

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

CREATE OR REPLACE VIEW public.vw_avg_topic_prob_network_nodes AS
SELECT
    speaker_1 AS speaker,
    bert_model_id
FROM public.bert_speaker_pairwise_distance
UNION
SELECT
    speaker_2 AS speaker,
    bert_model_id
FROM public.bert_speaker_pairwise_distance;

CREATE OR REPLACE VIEW public.vw_avg_topic_prob_network_edges AS
SELECT
    speaker_1,
    speaker_2,
    bert_model_id,
    distance_metric,
    distance_value,
    (1.0 - distance_value) AS similarity_weight
FROM public.bert_speaker_pairwise_distance;

-- ========= Step 4: Grant Permissions =========
-- Grant usage and select permissions for the anon role for frontend access.
GRANT USAGE ON SCHEMA public TO anon, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, service_role;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO anon, service_role;

-- Note: RLS is not enabled by default. This can be configured in the Supabase dashboard
-- after migration if needed.

