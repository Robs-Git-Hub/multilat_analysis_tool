
// src/graphs/mockTernaryData.ts

import type { RawCountItem } from '@/utils/ternaryDataProcessing';

/**
 * This is a direct translation of the mock data from the legacy
 * Python Dash prototype (`legacy/prototypes/dash_ternary_plot_demo.py`).
 *
 * It serves as a local, static data source for building and testing
 * the TernaryPlot component in isolation, without needing a live
 * database connection. This allows for rapid UI development and testing.
 */
export const MOCK_RAW_DATA: RawCountItem[] = [
  // CORRECTED: Added a unique 'id' to each object to satisfy the RawCountItem type.
  { id: 1, ngram: 'Disarmament', US: 400, Russia: 380, Middle: 420, Category: 'Category A' },
  { id: 2, ngram: 'Climate Change', US: 550, Russia: 30, Middle: 20, Category: 'Category B' },
  { id: 3, ngram: 'Human Rights', US: 300, Russia: 200, Middle: 400, Category: 'Category A' },
  { id: 4, ngram: 'Global Security', US: 100, Russia: 150, Middle: 50, Category: 'Category B' },
  { id: 5, ngram: 'Trade Policy', US: 250, Russia: 50, Middle: 150, Category: 'Category A' },
  { id: 6, ngram: 'Peacekeeping', US: 200, Russia: 180, Middle: 220, Category: 'Category B' },
  { id: 7, ngram: 'Development Aid', US: 150, Russia: 10, Middle: 80, Category: 'Category A' },
];