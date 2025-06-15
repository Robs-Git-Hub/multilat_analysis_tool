
import { supabase } from '@/integrations/supabase/client';

describe('Supabase Connection', () => {
  it('should have a valid supabase client instance', () => {
    expect(supabase).toBeDefined();
    expect(supabase.auth).toBeDefined();
    expect(supabase.from).toBeDefined();
    expect(typeof supabase.from).toBe('function');
  });

  it('should be able to create queries', () => {
    const query = supabase.from('oewg_ngram_statistics');
    expect(query).toBeDefined();
    expect(query.select).toBeDefined();
    expect(typeof query.select).toBe('function');
  });

  it('should have correct configuration', () => {
    // Test that the client is configured with the correct URL and key
    // Note: In a real test, we'd want to verify these are set correctly
    expect(supabase.supabaseUrl).toBeTruthy();
    expect(supabase.supabaseKey).toBeTruthy();
  });
});
