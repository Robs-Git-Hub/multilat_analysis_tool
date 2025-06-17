
// src/utils/searchUtils.test.ts
import { describe, it, expect } from 'vitest';
import { performSearch, type SearchableItem } from './searchUtils';

// Enhanced mock data with 'Category' and 'TotalMentions' fields to allow for
// comprehensive testing of multi-field search capabilities.
const mockData: SearchableItem[] = [
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
      const results = performSearch(mockData, `humon`, false);
      expect(results).toEqual([{ id: 1, ngram: 'Human Rights', Category: 'Social', TotalMentions: 300 }]);
    });

    it('should find different regional spellings', () => {
      // USER INPUT: color
      // EXPECTED BEHAVIOUR: Returns both 'Color Scheme' and 'Colour Scheme'.
      // WHY WE EXPECT THIS: Fuzzy mode is forgiving enough to match both the US and UK spellings of the word.
      const results = performSearch(mockData, `color`, false);
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
        const results = performSearch(mockData, `'Rights 'Animal`, true);
        expect(results).toEqual([{ id: 2, ngram: 'Animal Rights', Category: 'Social', TotalMentions: 200 }]);
      });

      it('should be case-insensitive', () => {
        // USER INPUT: 'rights 'animal
        // EXPECTED BEHAVIOUR: Returns only 'Animal Rights'.
        // WHY WE EXPECT THIS: The `isCaseSensitive` option is `false` by default, so the search should ignore case.
        const results = performSearch(mockData, `'rights 'animal`, true);
        expect(results).toEqual([{ id: 2, ngram: 'Animal Rights', Category: 'Social', TotalMentions: 200 }]);
      });
    });

    describe('Logical OR Operator (`|`)', () => {
      it('should return items containing EITHER term', () => {
        // USER INPUT: Human | Trade
        // EXPECTED BEHAVIOUR: Returns 'Human Rights' and 'Trade Policy'.
        // WHY WE EXPECT THIS: The `|` operator signifies OR logic, matching items that contain either term.
        const results = performSearch(mockData, `Human | Trade`, true);
        expect(results.map(r => r.ngram).sort()).toEqual(['Human Rights', 'Trade Policy']);
      });

      it('should be case-insensitive', () => {
        // USER INPUT: human | trade
        // EXPECTED BEHAVIOUR: Returns 'Human Rights' and 'Trade Policy'.
        // WHY WE EXPECT THIS: The search should ignore case.
        const results = performSearch(mockData, `human | trade`, true);
        expect(results.map(r => r.ngram).sort()).toEqual(['Human Rights', 'Trade Policy']);
      });
    });

    describe('Logical NOT Operator (`!`)', () => {
      it('should correctly exclude when using an explicit AND (`\'`)', () => {
        // USER INPUT: 'Rights !Human
        // EXPECTED BEHAVIOUR: Returns only 'Animal Rights'.
        // WHY WE EXPECT THIS: The `'` prefix enforces AND logic. The search finds items containing "Rights" AND that do NOT contain "Human".
        const results = performSearch(mockData, `'Rights !Human`, true);
        expect(results).toEqual([{ id: 2, ngram: 'Animal Rights', Category: 'Social', TotalMentions: 200 }]);
      });

      it('should treat a space as a literal, not a logical OR', () => {
        // USER INPUT: Rights !Human
        // EXPECTED BEHAVIOUR: Returns no results.
        // WHY WE EXPECT THIS: Without the `'` prefix for AND or `|` for OR, the space is not a logical operator. The library searches for the literal string "Rights !Human", which doesn't exist.
        const results = performSearch(mockData, `Rights !Human`, true);
        expect(results).toHaveLength(0);
      });
    });

    describe('Exact Phrase Operator (`"..."`)', () => {
      it('should return only items matching the exact phrase', () => {
        // USER INPUT: "Colour Scheme"
        // EXPECTED BEHAVIOUR: Returns only 'Colour Scheme'.
        // WHY WE EXPECT THIS: The double quotes enforce an exact, character-for-character match.
        const results = performSearch(mockData, `"Colour Scheme"`, true);
        expect(results).toEqual([{ id: 4, ngram: 'Colour Scheme', Category: 'Design', TotalMentions: 50 }]);
      });

      it('should be case-insensitive', () => {
        // USER INPUT: "colour scheme"
        // EXPECTED BEHAVIOUR: Returns only 'Colour Scheme'.
        // WHY WE EXPECT THIS: Even exact phrase matching is case-insensitive by default.
        const results = performSearch(mockData, `"colour scheme"`, true);
        expect(results).toEqual([{ id: 4, ngram: 'Colour Scheme', Category: 'Design', TotalMentions: 50 }]);
      });
    });

    describe('Multi-Field Search (General)', () => {
      it('should find a term in the `Category` field', () => {
        // USER INPUT: Economic
        // EXPECTED BEHAVIOUR: Returns 'Trade Policy'.
        // WHY WE EXPECT THIS: The search keys are configured to include `Category`, so a general search will find matches in that field.
        const results = performSearch(mockData, `Economic`, true);
        expect(results).toEqual([{ id: 3, ngram: 'Trade Policy', Category: 'Economic', TotalMentions: 500 }]);
      });

      it('should find a number (as text) in the `TotalMentions` field', () => {
        // USER INPUT: 300
        // EXPECTED BEHAVIOUR: Returns 'Human Rights'.
        // WHY WE EXPECT THIS: The search keys include `TotalMentions`. Fuse.js converts the number to a string and finds the match.
        const results = performSearch(mockData, `300`, true);
        expect(results).toEqual([{ id: 1, ngram: 'Human Rights', Category: 'Social', TotalMentions: 300 }]);
      });
    });
  });
});