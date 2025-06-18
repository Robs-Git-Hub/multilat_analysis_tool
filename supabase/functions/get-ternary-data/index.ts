// File: supabase/functions/get-ternary-data/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

console.log('get-ternary-data function starting up!')

// Define CORS headers to allow requests from our frontend
const corsHeaders = {
  'Access-Control-Allow-Origin': '*', // Allow any origin for now, can be restricted to specific domains
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // This is an OPTIONS request. It's a pre-flight check that browsers
  // send before making a real request to see if the server allows it.
  // We need to respond with the CORS headers to say "yes, you can".
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create a Supabase client with the Auth context of the user that called the function.
    // This way your row-level-security (RLS) policies are applied.
    // The SUPABASE_URL and SUPABASE_ANON_KEY are automatically injected by Supabase.
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Fetch the data from the 'ternary_options_with_defaults' view
    const { data, error } = await supabaseClient
      .from('ternary_options_with_defaults')
      .select('*')

    if (error) {
      // If there was an error fetching the data, throw it.
      throw error
    }

    // If we get here, the query was successful.
    // Return the data as JSON, along with the CORS headers.
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    // Handle any other errors that might occur
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})