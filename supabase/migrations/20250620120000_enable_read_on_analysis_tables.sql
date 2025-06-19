
-- This migration enables read access on the core analysis tables needed for the charts.
-- These tables contain public, aggregated data and are safe for client-side access.

-- 1. Enable Row Level Security (RLS) on the tables.
ALTER TABLE public.analysis_ngram_community_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_ai_labelled_topic_community_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analysis_bert_labelled_topic_community_stats ENABLE ROW LEVEL SECURITY;

-- 2. Drop any existing read policies to ensure a clean state.
DROP POLICY IF EXISTS "Allow public read access on analysis_ngram_community_stats" ON public.analysis_ngram_community_stats;
DROP POLICY IF EXISTS "Allow public read access on analysis_ai_labelled_topic_community_stats" ON public.analysis_ai_labelled_topic_community_stats;
DROP POLICY IF EXISTS "Allow public read access on analysis_bert_labelled_topic_community_stats" ON public.analysis_bert_labelled_topic_community_stats;

-- 3. Create new policies to grant read-only (`SELECT`) access to everyone.
CREATE POLICY "Allow public read access on analysis_ngram_community_stats"
ON public.analysis_ngram_community_stats
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on analysis_ai_labelled_topic_community_stats"
ON public.analysis_ai_labelled_topic_community_stats
FOR SELECT
USING (true);

CREATE POLICY "Allow public read access on analysis_bert_labelled_topic_community_stats"
ON public.analysis_bert_labelled_topic_community_stats
FOR SELECT
USING (true);