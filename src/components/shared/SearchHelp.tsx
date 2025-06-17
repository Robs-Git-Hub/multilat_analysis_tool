
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
    <PopoverContent className="w-80">
      <div className="grid gap-4">
        <div className="space-y-2">
          <h4 className="font-medium leading-none">Search Modes</h4>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Normal Search</p>
          <p className="text-muted-foreground">Returns close matches (fuzzy search).</p>
        </div>

        <Separator />

        <div className="text-sm">
          <p className="font-semibold">Precise Search</p>
          <p className="text-muted-foreground mb-2">Turns off fuzzy matching and enables the logical operators below.</p>
          <ul className="space-y-2">
            <li className="flex items-center">
              <code className="font-mono bg-gray-100 p-1 rounded">'report 'budget'</code>
              <span className="ml-2">Finds items with `report` AND `budget`.</span>
            </li>
            <li className="flex items-center">
              <code className="font-mono bg-gray-100 p-1 rounded">report | analysis</code>
              <span className="ml-2">Finds items with `report` OR `analysis`.</span>
            </li>
            <li className="flex items-center">
              <code className="font-mono bg-gray-100 p-1 rounded">'report !budget'</code>
              <span className="ml-2">Finds `report` but NOT `budget`.</span>
            </li>
            <li className="flex items-center">
              <code className="font-mono bg-gray-100 p-1 rounded">"annual report"</code>
              <span className="ml-2">Matches the exact phrase.</span>
            </li>
          </ul>
        </div>
      </div>
    </PopoverContent>
  </Popover>
);