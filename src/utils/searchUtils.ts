
// src/utils/searchUtils.ts
import Fuse, { type IFuseOptions } from 'fuse.js';

// Define a generic type for the items we're searching.
export interface SearchableItem {
  ngram: string;
  Category: string;
  TotalMentions: number;
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

  // The fields that Fuse.js will search within.
  // CORRECTED: Added TotalMentions to the list of searchable keys.
  const searchKeys = ['ngram', 'Category', 'TotalMentions'];

  // Fuzzy search options: forgiving and finds close matches.
  const fuzzyOptions: IFuseOptions<T> = {
    keys: searchKeys,
    threshold: 0.3,
  };

  // Precise search options: requires exact matches and enables logical operators.
  const preciseOptions: IFuseOptions<T> = {
    keys: searchKeys,
    useExtendedSearch: true,
    threshold: 0.0,
    distance: 0,
    ignoreLocation: false,
  };

  const fuse = new Fuse(data, isPrecise ? preciseOptions : fuzzyOptions);
  const results = fuse.search(filterText);

  return results.map(result => result.item);
}