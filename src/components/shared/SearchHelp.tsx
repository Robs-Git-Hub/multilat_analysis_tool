
// src/components/shared/SearchHelp.tsx
"use client";

import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from '@/components/ui/separator';

/**
 * A reusable popover component that displays help text for advanced search syntax.
 * This content has been updated to reflect the proven capabilities of the search library.
 */
export const SearchHelp = () => (
  <Popover>
    <PopoverTrigger asChild>
      <Button variant="ghost" size="icon" className="flex-shrink-0">
        <Info className="h-4 w-4" />
        <span className="sr-only">Show search help</span>
      </Button>
    </PopoverTrigger>
    <PopoverContent className="w-96">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Search Guide</h4>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Normal Mode</p>
          <p className="text-muted-foreground">Returns close ("fuzzy") matches. Great for finding typos or variations.</p>
        </div>

        <Separator />

        <div className="text-sm">
          <p className="font-semibold">Precise Mode</p>
          <p className="text-muted-foreground mb-2">Requires you to be explicit. A space between words is not an operator.</p>
          <ul className="space-y-3">
            <li className="flex items-start">
              {/* CORRECTED: Removed trailing quote */}
              <code className="mt-0.5 font-mono bg-gray-100 p-1 rounded">'report 'data</code>
              <span className="ml-2">Finds items with `report` **AND** `data`.</span>
            </li>
            <li className="flex items-start">
              <code className="mt-0.5 font-mono bg-gray-100 p-1 rounded">report | data</code>
              <span className="ml-2">Finds items with `report` **OR** `data`.</span>
            </li>
            <li className="flex items-start">
              {/* CORRECTED: Removed trailing quote */}
              <code className="mt-0.5 font-mono bg-gray-100 p-1 rounded">'report !data</code>
              <span className="ml-2">Finds items with `report` **AND NOT** `data`.</span>
            </li>
            <li className="flex items-start">
              <code className="mt-0.5 font-mono bg-gray-100 p-1 rounded">"annual report"</code>
              <span className="ml-2">Matches the **exact phrase** "annual report".</span>
            </li>
             <li className="flex items-start">
              <code className="mt-0.5 font-mono bg-gray-100 p-1 rounded">report data</code>
              <span className="ml-2 text-red-600">Returns **nothing**. You must use an operator like `|` or `'`.</span>
            </li>
          </ul>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);