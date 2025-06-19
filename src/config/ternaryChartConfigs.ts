
// src/config/ternaryChartConfigs.ts

/**
 * Defines the shape of a configuration object for a ternary chart data source.
 */
export interface TernaryChartConfig {
  table: string;
  idCol: string;
  labelCol: string;
  usCountCol: string;
  russiaCountCol: string;
  middleCountCol: string;
  entityTypeLabel: string;
}

/**
 * A centralized "menu" of all available data sources for ternary charts.
 * This replicates the `SHARED_DATA_CONFIGS` pattern from the legacy Python app,
 * promoting DRY principles and making it easy to add new charts in the future.
 */
export const TERNARY_CHART_CONFIGS: { [key: string]: TernaryChartConfig } = {
  /**
   * The primary, curated list of ngrams for the Keyword Analysis page.
   * This is the active and verified configuration.
   */
  ngrams: {
    table: 'analysis_ngram_community_stats',
    idCol: 'ngram', // For React keys and filtering, the unique ngram string is most useful.
    labelCol: 'ngram',
    usCountCol: 'count_A',
    russiaCountCol: 'count_G',
    middleCountCol: 'count_BCDE',
    entityTypeLabel: 'Ngram',
  },

  /**
   * Future configuration for a chart of AI-labelled topics.
   * The table and column names are based on the legacy app's config.
   * This is currently commented out and will be enabled when the feature is built.
   */
  /*
  ai_topics: {
    table: 'analysis_ai_labelled_topic_community_stats',
    idCol: 'topic_id',
    labelCol: 'topic_short_description',
    usCountCol: 'count_A',
    russiaCountCol: 'count_G',
    middleCountCol: 'count_BCDE',
    entityTypeLabel: 'AI Topic',
  },
  */

  /**
   * Future configuration for a chart of BERT-labelled topics.
   * The table and column names are based on the legacy app's config.
   * This is currently commented out and will be enabled when the feature is built.
   */
  /*
  bert_topics: {
    table: 'analysis_bert_labelled_topic_community_stats',
    idCol: 'topic_id',
    labelCol: 'topic_short_description',
    usCountCol: 'count_A',
    russiaCountCol: 'count_G',
    middleCountCol: 'count_BCDE',
    entityTypeLabel: 'BERT Topic',
  },
  */
};