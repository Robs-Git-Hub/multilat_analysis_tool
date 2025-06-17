
// src/utils/searchUtils.ts
import Fuse, { type IFuseOptions } from 'fuse.js';
// ADDED: Import the canonical data type from its source.
import type { ItemWithSize } from './ternaryDataProcessing';

// REMOVED: The incorrect, redundant SearchableItem interface.

/**
 * Performs a search on an array of items using Fuse.js, dynamically switching
 * between fuzzy and precise search modes.
 *
 * @param data The array of items to search through (must be of type ItemWithSize).
 * @param filterText The search query from the user.
 * @param isPrecise A boolean to toggle between search modes.
 * @returns The filtered array of items.
 */
export function performSearch(
  data: ItemWithSize[],
  filterText: string,
  isPrecise: boolean,
): ItemWithSize[] {
  if (!filterText) {
    return data;
  }

  // The fields that Fuse.js will search within.
  const searchKeys = ['ngram', 'Category', 'TotalMentions'];

  // Fuzzy search options: forgiving and finds close matches.
  const fuzzyOptions: IFuseOptions<ItemWithSize> = {
    keys: searchKeys,
    threshold: 0.3,
  };

  // Precise search options: requires exact matches and enables logical operators.
  const preciseOptions: IFuseOptions<ItemWithSize> = {
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