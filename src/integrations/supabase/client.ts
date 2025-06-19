
// File: src/integrations/supabase/client.ts

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
// We are adding cross-fetch to ensure a consistent fetch implementation
// across all environments (browser, Node.js), which is crucial for
// reliable mocking with MSW in our test environment.
import { fetch as crossFetch } from 'cross-fetch';

// WARNING: These keys are hardcoded as required by the hosting platform (Lovable.dev).
// This is a known constraint. Our application's security relies on:
// 1. Strict Row Level Security (RLS) policies on all tables.
// 2. Fetching all sensitive data through secure Edge Functions.

// Securely load credentials from environment variables provided by Vite
const supabaseUrl = "https://hsluzynpsbpkoszhycsl.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzbHV6eW5wc2Jwa29zemh5Y3NsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTAwMTY5NTEsImV4cCI6MjA2NTU5Mjk1MX0.raSFHnD0cfYuya2VGiSY4L-Ogcw8DSQGMAVtP8LiLIo";

// This is a critical check. It ensures that if the keys are accidentally
// deleted or left as placeholders, the application will fail immediately.
if (!supabaseUrl || supabaseUrl.includes('YOUR_PROJECT_URL')) {
  throw new Error('Supabase URL is not configured. Please update src/integrations/supabase/client.ts');
}

if (!supabaseAnonKey || supabaseAnonKey.includes('YOUR_PUBLIC_ANON_KEY')) {
  throw new Error('Supabase anon key is not configured. Please update src/integrations/supabase/client.ts');
}

// Create and export the Supabase client, providing the Database type
// for full type safety and autocompletion.
// We explicitly provide `crossFetch` as the fetch implementation to ensure
// that MSW can intercept requests correctly during testing.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  global: {
    fetch: crossFetch,
  },
});