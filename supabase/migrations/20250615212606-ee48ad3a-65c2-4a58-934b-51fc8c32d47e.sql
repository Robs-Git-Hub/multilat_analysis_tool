
-- Rename columns in analysis_ngram_community_stats to match case-sensitive source data
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN count_a TO "count_A";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN count_bcde TO "count_BCDE";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN count_f TO "count_F";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN count_g TO "count_G";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN relative_frequency_a TO "relative_frequency_A";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN relative_frequency_bcde TO "relative_frequency_BCDE";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN relative_frequency_f TO "relative_frequency_F";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN relative_frequency_g TO "relative_frequency_G";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN normalized_frequency_a TO "normalized_frequency_A";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN normalized_frequency_bcde TO "normalized_frequency_BCDE";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN normalized_frequency_f TO "normalized_frequency_F";
ALTER TABLE public.analysis_ngram_community_stats RENAME COLUMN normalized_frequency_g TO "normalized_frequency_G";

-- Rename columns in analysis_ai_labelled_topic_community_stats to match case-sensitive source data
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN count_a TO "count_A";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN count_bcde TO "count_BCDE";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN count_f TO "count_F";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN count_g TO "count_G";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN relative_frequency_a TO "relative_frequency_A";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN relative_frequency_bcde TO "relative_frequency_BCDE";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN relative_frequency_f TO "relative_frequency_F";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN relative_frequency_g TO "relative_frequency_G";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN normalized_frequency_a TO "normalized_frequency_A";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN normalized_frequency_bcde TO "normalized_frequency_BCDE";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN normalized_frequency_f TO "normalized_frequency_F";
ALTER TABLE public.analysis_ai_labelled_topic_community_stats RENAME COLUMN normalized_frequency_g TO "normalized_frequency_G";

-- Rename columns in analysis_bert_labelled_topic_community_stats to match case-sensitive source data
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN count_a TO "count_A";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN count_bcde TO "count_BCDE";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN count_f TO "count_F";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN count_g TO "count_G";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN relative_frequency_a TO "relative_frequency_A";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN relative_frequency_bcde TO "relative_frequency_BCDE";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN relative_frequency_f TO "relative_frequency_F";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN relative_frequency_g TO "relative_frequency_G";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN normalized_frequency_a TO "normalized_frequency_A";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN normalized_frequency_bcde TO "normalized_frequency_BCDE";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN normalized_frequency_f TO "normalized_frequency_F";
ALTER TABLE public.analysis_bert_labelled_topic_community_stats RENAME COLUMN normalized_frequency_g TO "normalized_frequency_G";
