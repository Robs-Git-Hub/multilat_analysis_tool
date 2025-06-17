
// src/utils/searchUtils.ts
import Fuse, { type IFuseOptions } from 'fuse.js';

// Define a generic type for the items we're searching, assuming they have an 'ngram' property.
export interface SearchableItem {
  ngram: string;
  [key: string]: any; // Allow other properties
}

/**
 * Performs a search on an array of items using Fuse.js, dynamically switching
 * between fuzzy and precise search modes.
 *
 * @param data The array of items to search through.
 * @param filterText The search query from the user.
 * @param isPrecise A boolean to toggle between search modes.
 * @returns The filtered array of items.
 */
export function performSearch<T extends SearchableItem>(
  data: T[],
  filterText: string,
  isPrecise: boolean,
): T[] {
  if (!filterText) {
    return data;
  }

  // Fuzzy search options: forgiving and finds close matches.
  const fuzzyOptions: IFuseOptions<T> = {
    keys: ['ngram'],
    threshold: 0.3, // Allows for some fuzziness
  };

  // Precise search options: requires exact matches and enables logical operators.
  const preciseOptions: IFuseOptions<T> = {
    keys: ['ngram'],
    useExtendedSearch: true, // Enables operators like !, ", '
    threshold: 0.0, // CRITICAL: Requires a perfect match
  };

  const fuse = new Fuse(data, isPrecise ? preciseOptions : fuzzyOptions);
  const results = fuse.search(filterText);

  return results.map(result => result.item);
}