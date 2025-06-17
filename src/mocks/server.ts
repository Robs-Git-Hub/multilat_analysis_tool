
// src/mocks/server.ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Creates a request-interception server for Node.js environments (e.g., Vitest).
 *
 * @see https://mswjs.io/docs/api/setup-server
 */
export const server = setupServer(...handlers);