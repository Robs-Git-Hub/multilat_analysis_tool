
-- setup_supabase_tables.sql

-- 1. Create the 'countries' table
CREATE TABLE IF NOT EXISTS countries (
    id SERIAL PRIMARY KEY,
    country_name TEXT UNIQUE NOT NULL,
    country_code VARCHAR(3),
    region TEXT,
    sub_region TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create the 'interventions' table
CREATE TABLE IF NOT EXISTS interventions (
    id SERIAL PRIMARY KEY,
    country_id INTEGER REFERENCES countries(id),
    session_id TEXT,
    speaker_name TEXT,
    intervention_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create the 'ngram_statistics' table
-- Note: 'oewg_ngram_statistics' is renamed to 'ngram_statistics' for simplicity
CREATE TABLE IF NOT EXISTS ngram_statistics (
    id SERIAL PRIMARY KEY,
    country_name TEXT,
    session_id TEXT,
    ngram_term TEXT,
    mention_count INTEGER,
    x_coord REAL,
    y_coord REAL,
    z_coord REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_ngram_term ON ngram_statistics(ngram_term);
CREATE INDEX IF NOT EXISTS idx_ngram_session_country ON ngram_statistics(session_id, country_name);


-- 4. Create the 'speech_sentences' table
CREATE TABLE IF NOT EXISTS speech_sentences (
    id SERIAL PRIMARY KEY,
    intervention_id INTEGER REFERENCES interventions(id),
    sentence_order INTEGER,
    sentence_text TEXT,
    relevance_score REAL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_sentence_intervention_id ON speech_sentences(intervention_id);


-- Grant usage and select permissions for the anon role if needed
-- This is often required for frontend access via Supabase JS client
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- For service_role (used by this migration script), access should be granted by default.
-- You might want to enable RLS (Row Level Security) on these tables
-- in the Supabase dashboard after migration.
-- Example:
-- ALTER TABLE countries ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Allow read-only access to everyone" ON countries FOR SELECT USING (true);
