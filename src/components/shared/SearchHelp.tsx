
// src/components/shared/SearchHelp.tsx
"use client";

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * A reusable popover component that displays help text for advanced search syntax.
 */
export const SearchHelp = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <Info className="h-4 w-4" />
        <span className="sr-only">Show search help</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-80">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Search Commands</h4>
          <p className="text-sm text-muted-foreground">
            Combine these patterns for powerful searches.
          </p>
        </div>
        <ul className="text-sm space-y-2">
          <li className="flex items-center">
            <code className="font-mono bg-gray-100 p-1 rounded">word1 word2</code>
            <span className="ml-2">Finds `word1` OR `word2`.</span>
          </li>
          <li className="flex items-center">
            <code className="font-mono bg-gray-100 p-1 rounded">"exact phrase"</code>
            <span className="ml-2">Matches the exact phrase.</span>
          </li>
          <li className="flex items-center">
            <code className="font-mono bg-gray-100 p-1 rounded">!word</code>
            <span className="ml-2">Excludes items with `word`.</span>
          </li>
          <li className="flex items-center">
            <code className="font-mono bg-gray-100 p-1 rounded">'word1 'word2</code>
            <span className="ml-2">Finds `word1` AND `word2`.</span>
          </li>
          <li className="flex items-center">
            <code className="font-mono bg-gray-100 p-1 rounded">disarmement</code>
            <span className="ml-2">Typo-tolerant search.</span>
          </li>
        </ul>
      </div>
    </PopoverContent>
  </Popover>
);