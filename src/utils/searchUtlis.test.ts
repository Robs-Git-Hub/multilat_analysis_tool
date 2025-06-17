
// src/utils/searchUtils.test.ts
import { describe, it, expect } from 'vitest';
import { performSearch } from './searchUtils';
import type { ItemWithSize } from './ternaryDataProcessing';

// Enhanced mock data with 'Category' and 'TotalMentions' fields to allow for
// comprehensive testing of multi-field search capabilities.
const mockData: Partial<ItemWithSize>[] = [
  { id: 1, ngram: 'Human Rights',    Category: 'Social',   TotalMentions: 300 },
  { id: 2, ngram: 'Animal Rights',   Category: 'Social',   TotalMentions: 200 },
  { id: 3, ngram: 'Trade Policy',    Category: 'Economic', TotalMentions: 500 },
  { id: 4, ngram: 'Colour Scheme',   Category: 'Design',   TotalMentions: 50 },
  { id: 5, ngram: 'Color Scheme',    Category: 'Design',   TotalMentions: 50 },
];

describe('performSearch', () => {
  // ===========================================================================
  // Fuzzy Search Tests (isPrecise = false)
  // These tests confirm that the default mode is forgiving.
  // ===========================================================================
  describe('Fuzzy Mode (isPrecise: false)', () => {
    it('should return close matches for typos', () => {
      // USER INPUT: humon
      // EXPECTED BEHAVIOUR: Returns the 'Human Rights' item.
      // WHY WE EXPECT THIS: In fuzzy mode (`isPrecise: false`), the `threshold` setting allows for near matches and spelling errors.
      const results = performSearch(mockData as ItemWithSize[], `humon`, false);
      expect(results).toEqual([{ id: 1, ngram: 'Human Rights', Category: 'Social', TotalMentions: 300 }]);
    });

    it('should find different regional spellings', () => {
      // USER INPUT: color
      // EXPECTED BEHAVIOUR: Returns both 'Color Scheme' and 'Colour Scheme'.
      // WHY WE EXPECT THIS: Fuzzy mode is forgiving enough to match both the US and UK spellings of the word.
      const results = performSearch(mockData as ItemWithSize[], `color`, false);
      expect(results.map(r => r.ngram).sort()).toEqual(['Color Scheme', 'Colour Scheme']);
    });
  });

  // ===========================================================================
  // Precise Search Tests (isPrecise = true)
  // These tests verify that all logical operators work as documented and that
  // matching is exact and case-insensitive across all specified search keys.
  // ===========================================================================
  describe('Precise Mode (isPrecise: true)', () => {

    describe('Logical AND Operator (`\'`)', () => {
      it('should return only items containing BOTH terms', () => {
        // USER INPUT: 'Rights 'Animal
        // EXPECTED BEHAVIOUR: Returns only 'Animal Rights'.
        // WHY WE EXPECT THIS: The `'` prefix enforces AND logic. The item must contain both "Rights" AND "Animal".
        const results = performSearch(mockData as ItemWithSize[], `'Rights 'Animal`, true);
        expect(results).toEqual([{ id: 2, ngram: 'Animal Rights', Category: 'Social', TotalMentions: 200 }]);
      });
    });

    describe('Logical OR Operator (`|`)', () => {
      it('should return items containing EITHER term', () => {
        // USER INPUT: Human | Trade
        // EXPECTED BEHAVIOUR: Returns 'Human Rights' and 'Trade Policy'.
        // WHY WE EXPECT THIS: The `|` operator signifies OR logic, matching items that contain either term.
        const results = performSearch(mockData as ItemWithSize[], `Human | Trade`, true);
        expect(results.map(r => r.ngram).sort()).toEqual(['Human Rights', 'Trade Policy']);
      });
    });

    describe('Logical NOT Operator (`!`)', () => {
      it('should correctly exclude when using an explicit AND (`\'`)', () => {
        // USER INPUT: 'Rights !Human
        // EXPECTED BEHAVIOUR: Returns only 'Animal Rights'.
        // WHY WE EXPECT THIS: The `'` prefix enforces AND logic. The search finds items containing "Rights" AND that do NOT contain "Human".
        const results = performSearch(mockData as ItemWithSize[], `'Rights !Human`, true);
        expect(results).toEqual([{ id: 2, ngram: 'Animal Rights', Category: 'Social', TotalMentions: 200 }]);
      });
    });

    describe('Exact Phrase Operator (`"..."`)', () => {
      it('should return only items matching the exact phrase', () => {
        // USER INPUT: "Colour Scheme"
        // EXPECTED BEHAVIOUR: Returns only 'Colour Scheme'.
        // WHY WE EXPECT THIS: The double quotes enforce an exact, character-for-character match.
        const results = performSearch(mockData as ItemWithSize[], `"Colour Scheme"`, true);
        expect(results).toEqual([{ id: 4, ngram: 'Colour Scheme', Category: 'Design', TotalMentions: 50 }]);
      });
    });

    describe('General Syntax Rules', () => {
      it('should return no results for multiple words without an operator', () => {
        // USER INPUT: Human Rights
        // EXPECTED BEHAVIOUR: Returns no results.
        // WHY WE EXPECT THIS: In precise mode, a space is not a logical operator. The user must explicitly use `|` for OR, `'` for AND, or `"` for an exact phrase.
        const results = performSearch(mockData as ItemWithSize[], `Human Rights`, true);
        expect(results).toHaveLength(0);
      });
    });

    describe('Ambiguity and Specificity', () => {
      it('should return a match for a single, unambiguous term without an operator', () => {
        // USER INPUT: trade
        // EXPECTED BEHAVIOUR: Returns 'Trade Policy'.
        // WHY WE EXPECT THIS: The word "trade" is unique to one item. Fuse.js makes an exception to the "no operators" rule because there is no ambiguity.
        const results = performSearch(mockData as ItemWithSize[], `trade`, true);
        expect(results.map(r => r.ngram)).toEqual(['Trade Policy']);
      });

      it('should return no match for a single, ambiguous term without an operator', () => {
        // USER INPUT: rights
        // EXPECTED BEHAVIOUR: Returns no results.
        // WHY WE EXPECT THIS: The word "rights" appears in multiple items. Fuse.js refuses to guess which one the user wants and returns nothing, forcing the user to be more specific.
        const results = performSearch(mockData as ItemWithSize[], `rights`, true);
        expect(results).toHaveLength(0);
      });

      it('should return all matches for an ambiguous term when made specific with an operator', () => {
        // USER INPUT: 'rights
        // EXPECTED BEHAVIOUR: Returns both 'Human Rights' and 'Animal Rights'.
        // WHY WE EXPECT THIS: The `'` prefix is an explicit instruction to find all items containing "rights", resolving the ambiguity.
        const results = performSearch(mockData as ItemWithSize[], `'rights`, true);
        expect(results.map(r => r.ngram).sort()).toEqual(['Animal Rights', 'Human Rights']);
      });
    });

    describe('Multi-Field Search (General)', () => {
      it('should find a term in the `Category` field', () => {
        // USER INPUT: Economic
        // EXPECTED BEHAVIOUR: Returns 'Trade Policy'.
        // WHY WE EXPECT THIS: The search keys are configured to include `Category`, so a general search will find matches in that field.
        const results = performSearch(mockData as ItemWithSize[], `Economic`, true);
        expect(results).toEqual([{ id: 3, ngram: 'Trade Policy', Category: 'Economic', TotalMentions: 500 }]);
      });

      it('should find a number (as text) in the `TotalMentions` field', () => {
        // USER INPUT: 300
        // EXPECTED BEHAVIOUR: Returns 'Human Rights'.
        // WHY WE EXPECT THIS: The search keys include `TotalMentions`. Fuse.js converts the number to a string and finds the match.
        const results = performSearch(mockData as ItemWithSize[], `300`, true);
        expect(results).toEqual([{ id: 1, ngram: 'Human Rights', Category: 'Social', TotalMentions: 300 }]);
      });
    });
  });
});