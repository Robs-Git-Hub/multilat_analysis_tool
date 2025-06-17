
// src/mocks/handlers.ts
import { http, HttpResponse } from 'msw';

/**
 * Defines the request handlers for the MSW.
 * This array will be populated with handlers for our Supabase queries.
 *
 * @see https://mswjs.io/docs/basics/request-handler
 */
export const handlers = [
  // Example handler (commented out):
  // http.post('https://*.supabase.co/rest/v1/rpc/your_function', () => {
  //   return HttpResponse.json({ message: 'Success!' })
  // }),
];