
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

// This is the mock data that will be returned by default for any test
// that queries the `oewg_ngram_statistics` table.
const mockTernaryData = [
  {
    ngram: 'test ngram',
    normalized_frequency_A: 0.1,
    normalized_frequency_BCDE: 0.2,
    normalized_frequency_F: 0.3,
    normalized_frequency_G: 0.4,
    count_A: 10,
    count_BCDE: 20,
    count_F: 30,
    count_G: 40,
    p_value: 0.05,
    lor_polarization_score: 1.5,
  },
  {
    ngram: 'null ngram',
    normalized_frequency_A: null,
    normalized_frequency_BCDE: 0.5,
    normalized_frequency_F: null,
    normalized_frequency_G: 0.5,
    count_A: null,
    count_BCDE: 50,
    count_F: null,
    count_G: 50,
    p_value: null,
    lor_polarization_score: null,
  },
];

export const handlers = [
  // This handler intercepts GET requests to the Supabase endpoint for
  // the 'oewg_ngram_statistics' table and returns our mock data.
  // This serves as the default "happy path" for all tests.
  http.get('https://*.supabase.co/rest/v1/oewg_ngram_statistics', () => {
    return HttpResponse.json(mockTernaryData);
  }),
];