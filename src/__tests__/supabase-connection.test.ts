
// src/__tests__/supabase-connection.test.ts

import { supabase } from '@/integrations/supabase/client';

// This test suite is unique. Unlike other tests, it is designed to make
// REAL network calls to the live Supabase database. Its purpose is to act as
// a foundational, automated check to ensure our credentials, network access,
// and Row Level Security (RLS) policies are correctly configured for the key
// tables and views required by the application.

describe('Supabase Connection and Permissions', () => {
  // Test 1: A quick synchronous check that the Supabase client initialized correctly.
  it('should have a valid supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  // Test 2: A comprehensive suite for TABLES.
  // This list is derived from the "Data Mapping" investigation.
  const requiredTables = ['oewg_ngram_statistics', 'intervention', 'country'] as const;

  describe.each(requiredTables)('Table: %s', (table) => {
    it('should be able to perform a simple, read-only query without error', async () => {
      const { error } = await supabase.from(table).select('*', { head: true });
      expect(error).toBeNull();
    });
  });

  // Test 3: A comprehensive suite for VIEWS.
  // This list is also derived from the "Data Mapping" investigation.
  const requiredViews = [
    'vw_ngram_sentence_unpivoted',
    'vw_country_ngram_sentence_counts',
  ] as const;

  describe.each(requiredViews)('View: %s', (view) => {
    it('should be able to perform a simple, read-only query without error', async () => {
      // We use `{ head: true }` as a performance optimization. It tells Supabase
      // to execute the query and check permissions, but not to return any actual
      // row data. This is the most efficient way to confirm connectivity.
      const { error } = await supabase.from(view).select('*', { head: true });

      // The test passes if the error object is null.
      // A non-null error would indicate a problem with credentials, RLS, or the view name.
      expect(error).toBeNull();
    });
  });
});