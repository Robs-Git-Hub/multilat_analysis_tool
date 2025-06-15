
-- Rename columns in oewg_ngram_statistics to be case-sensitive to match the source SQLite DB
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN count_a TO "count_A";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN count_bcde TO "count_BCDE";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN count_f TO "count_F";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN count_g TO "count_G";

ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN relative_frequency_a TO "relative_frequency_A";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN relative_frequency_bcde TO "relative_frequency_BCDE";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN relative_frequency_f TO "relative_frequency_F";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN relative_frequency_g TO "relative_frequency_G";

ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN normalized_frequency_a TO "normalized_frequency_A";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN normalized_frequency_bcde TO "normalized_frequency_BCDE";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN normalized_frequency_f TO "normalized_frequency_F";
ALTER TABLE public.oewg_ngram_statistics RENAME COLUMN normalized_frequency_g TO "normalized_frequency_G";
