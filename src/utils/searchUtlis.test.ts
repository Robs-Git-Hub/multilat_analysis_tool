
// src/utils/searchUtils.test.ts
import { describe, it, expect } from 'vitest';
import { performSearch, type SearchableItem } from './searchUtils';

// Simplified mock data as requested, matching the SearchableItem structure.
const mockData: SearchableItem[] = [
  { id: 1, ngram: 'Human Rights' },
  { id: 2, ngram: 'Animal Rights' },
  { id: 3, ngram: 'Trade Policy' },
  { id: 4, ngram: 'Colour Scheme' },
  { id: 5, ngram: 'Color Scheme' },
];

describe('performSearch', () => {
  // --- Group 1: Fuzzy Search Tests (isPrecise = false) ---
  describe('Fuzzy Mode (isPrecise: false)', () => {
    it('should return close matches for typos', () => {
      const results = performSearch(mockData, 'humon', false);
      expect(results).toEqual([{ id: 1, ngram: 'Human Rights' }]);
    });

    it('should find different spellings', () => {
      const results = performSearch(mockData, 'color', false);
      // Expect both US and UK spelling versions
      expect(results.map(r => r.ngram).sort()).toEqual(['Color Scheme', 'Colour Scheme']);
    });

    it('should ignore logical operators and treat them as text', () => {
      const results = performSearch(mockData, '!Human', false);
      // It should find "Human Rights" because it's just looking for "Human"
      expect(results).toEqual([{ id: 1, ngram: 'Human Rights' }]);
    });
  });

  // --- Group 2: Precise Search Tests (isPrecise = true) ---
  describe('Precise Mode (isPrecise: true)', () => {
    it('should correctly apply the NOT operator (!)', () => {
      const results = performSearch(mockData, '!Human', true);
      const ngrams = results.map(r => r.ngram);
      
      expect(ngrams).not.toContain('Human Rights');
      expect(ngrams).toContain('Animal Rights');
      expect(ngrams).toContain('Trade Policy');
    });

    it('should correctly apply the exact phrase operator ("")', () => {
      const results = performSearch(mockData, '"Animal Rights"', true);
      expect(results).toEqual([{ id: 2, ngram: 'Animal Rights' }]);
    });

    it('should return no results for an inexact phrase match', () => {
      const results = performSearch(mockData, '"Animal Right"', true);
      expect(results).toHaveLength(0);
    });

    it('should correctly apply the OR operator (space)', () => {
      const results = performSearch(mockData, 'Human Trade', true);
      const ngrams = results.map(r => r.ngram).sort();
      expect(ngrams).toEqual(['Human Rights', 'Trade Policy']);
    });
    
    it('should correctly apply the AND operator (\')', () => {
      const results = performSearch(mockData, "'Animal 'Rights", true);
      expect(results).toEqual([{ id: 2, ngram: 'Animal Rights' }]);
    });

    it('should return no results for a failed AND search', () => {
      const results = performSearch(mockData, "'Human 'Animal", true);
      expect(results).toHaveLength(0);
    });
  });
});