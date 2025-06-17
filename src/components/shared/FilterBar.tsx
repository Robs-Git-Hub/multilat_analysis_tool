
// src/components/shared/FilterBar.tsx
"use client";

import { Input } from "@/components/ui/input";

interface FilterBarProps {
  filterText: string;
  onFilterTextChange: (text: string) => void;
  placeholder?: string;
}

export const FilterBar: React.FC<FilterBarProps> = ({ 
  filterText, 
  onFilterTextChange,
  placeholder = "Search items..." 
}) => {
  return (
    <div className="w-full">
      <Input
        type="text"
        placeholder={placeholder}
        value={filterText}
        onChange={(e) => onFilterTextChange(e.target.value)}
        className="max-w-sm"
      />
    </div>
  );
};