
// src/mocks/browser.ts
import { setupWorker } from 'msw/browser'; // CORRECTED IMPORT PATH
import { handlers } from './handlers';

/**
 * Creates a Service Worker instance for browser environments.
 *
 * @see https://mswjs.io/docs/api/setup-worker
 */
export const worker = setupWorker(...handlers);