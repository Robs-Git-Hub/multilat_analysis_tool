
// src/__tests__/setup.ts
import '@testing-library/jest-dom';
import { beforeAll, afterEach, afterAll } from 'vitest';
import { server } from '../mocks/server'; // Import the mock server
import { vi } from 'vitest';

// --- MSW SERVER LIFECYCLE ---
// This block sets up and tears down the mock server for our tests.

// 1. Start the server before any tests run.
beforeAll(() => server.listen());

// 2. Reset any runtime request handlers we may add during tests.
// This ensures that tests don't interfere with each other.
afterEach(() => server.resetHandlers());

// 3. Close the server after all tests have finished.
afterAll(() => server.close());

// --- EXISTING GLOBAL MOCKS ---

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: vi.fn(),
  error: vi.fn(),
  warn: vi.fn(),
};

// Mock IntersectionObserver
class MockIntersectionObserver implements IntersectionObserver {
  readonly root: Element | null = null;
  readonly rootMargin: string = '';
  readonly thresholds: ReadonlyArray<number> = [];
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}
global.IntersectionObserver = MockIntersectionObserver;


// Mock ResizeObserver
class MockResizeObserver implements ResizeObserver {
  constructor() {}
  observe() {}
  unobserve() {}
  disconnect() {}
}
global.ResizeObserver = MockResizeObserver;