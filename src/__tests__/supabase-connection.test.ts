
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

  // Test 2: A comprehensive suite of REAL integration tests.
  // We use `describe.each` to run the same test logic for each table,
  // keeping our code DRY (Don't Repeat Yourself).
  const requiredTables = [
    'oewg_members',
    'oewg_sessions',
    'oewg_documents',
    'oewg_paragraphs',
    'oewg_views_referenced_documents',
    'oewg_views_topic_and_sentiment',
    'oewg_views_topic_and_sentiment_by_country',
    'oewg_views_topic_and_sentiment_by_region',
  ];

  describe.each(requiredTables)('Table: %s', (table) => {
    it('should be able to perform a simple, read-only query without error', async () => {
      // We use `{ head: true }` as a performance optimization. It tells Supabase
      // to execute the query and check permissions, but not to return any actual
      // row data. This is the most efficient way to confirm connectivity.
      const { error } = await supabase.from(table).select('*', { head: true });

      // The test passes if the error object is null.
      // A non-null error would indicate a problem with credentials, RLS, or the table name.
      expect(error).toBeNull();
    });
  });
});