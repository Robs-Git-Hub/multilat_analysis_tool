
// src/__tests__/supabase-schema.integration.test.ts

import { supabase } from '@/integrations/supabase/client';
import { server } from '@/mocks/server';
import { beforeAll, afterAll } from 'vitest';

// This is an INTEGRATION test. We must disable the mock server
// to allow it to make real network calls to the live Supabase database.
beforeAll(() => server.close());
afterAll(() => server.listen());

describe('Supabase Schema Validation', () => {
  // ... rest of the file is unchanged ...
  const requiredTables = [
    {
      name: 'oewg_ngram_statistics',
      fields: ['ngram', 'count_A', 'count_G', 'count_BCDE', 'count_all_communities'],
    },
    {
      name: 'intervention',
      fields: ['speaker', 'speaker_type'],
    },
    {
      name: 'country',
      fields: ['id', 'merge_name', 'cpm_community_after_10_CPM_0_53'],
    },
  ] as const;

  const requiredViews = [
    {
      name: 'vw_ngram_sentence_unpivoted',
      fields: ['sentence_full'],
    },
    {
      name: 'vw_country_ngram_sentence_counts',
      fields: ['country_speaker', 'ngram_id', 'count_sentences_for_ngram_by_country'],
    },
  ] as const;

  describe.each(requiredTables)('Table Schema: $name', ({ name, fields }) => {
    it('should fetch one row and contain all required fields', async () => {
      const { data, error } = await supabase.from(name).select('*').limit(1);
      expect(error, `Query to "${name}" should not produce an error.`).toBeNull();
      expect(data, `Query to "${name}" should return data.`).not.toBeNull();
      if (!data) return;
      expect(data.length, `Query to "${name}" should return at least one row.`).toBeGreaterThan(0);
      const row = data[0];
      for (const field of fields) {
        expect(row, `Field "${field}" should exist on data from "${name}".`).toHaveProperty(field);
      }
    });
  });

  describe.each(requiredViews)('View Schema: $name', ({ name, fields }) => {
    it('should fetch one row and contain all required fields', async () => {
      const { data, error } = await supabase.from(name).select('*').limit(1);
      expect(error, `Query to "${name}" should not produce an error.`).toBeNull();
      expect(data, `Query to "${name}" should return data.`).not.toBeNull();
      if (!data) return;
      expect(data.length, `Query to "${name}" should return at least one row.`).toBeGreaterThan(0);
      const row = data[0];
      for (const field of fields) {
        expect(row, `Field "${field}" should exist on data from "${name}".`).toHaveProperty(field);
      }
    });
  });
});