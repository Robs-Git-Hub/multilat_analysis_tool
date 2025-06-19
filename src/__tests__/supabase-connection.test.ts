
// src/__tests__/supabase-connection.test.ts

import { supabase } from '@/integrations/supabase/client';
import { server } from '@/mocks/server';
import { beforeAll, afterAll } from 'vitest';

// This is an INTEGRATION test. We must disable the mock server
// to allow it to make real network calls to the live Supabase database.
beforeAll(() => server.close());
afterAll(() => server.listen());

describe('Supabase Connection and Permissions', () => {
  // ... rest of the file is unchanged ...
  it('should have a valid supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  const requiredTables = ['oewg_ngram_statistics', 'intervention', 'country'] as const;
  describe.each(requiredTables)('Table: %s', (table) => {
    it('should be able to perform a simple, read-only query without error', async () => {
      const { error } = await supabase.from(table).select('*', { head: true });
      expect(error).toBeNull();
    });
  });

  const requiredViews = [
    'vw_ngram_sentence_unpivoted',
    'vw_country_ngram_sentence_counts',
  ] as const;
  describe.each(requiredViews)('View: %s', (view) => {
    it('should be able to perform a simple, read-only query without error', async () => {
      const { error } = await supabase.from(view).select('*', { head: true });
      expect(error).toBeNull();
    });
  });
});