
// src/components/shared/DataTable.tsx
"use client";

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onRowClick?: (item: T) => void;
}

export function DataTable<T extends { id: string | number }>({ data, columns, onRowClick }: DataTableProps<T>) {
  const isMobile = useIsMobile();
  const parentRef = React.useRef<HTMLDivElement>(null);

  const handleItemClick = (item: T) => {
    if (onRowClick) {
      onRowClick(item);
    }
  };

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => isMobile ? 150 : 53, // Card height vs. Table row height
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  if (!data.length) {
    // On desktop, the "no results" needs to be inside the table structure to maintain layout
    return isMobile ? (
      <div className="text-center p-8 bg-gray-50 rounded-lg border mt-4">
        <p className="text-gray-600">No results.</p>
      </div>
    ) : (
      <div className="rounded-md border mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={String(column.key)}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    );
  }

  // --- Mobile Card View (Virtualized) ---
  if (isMobile) {
    const titleColumn = columns[0];
    const contentColumns = columns.length > 1 ? columns.slice(1) : [];

    return (
      <div
        ref={parentRef}
        className="mt-4 overflow-y-auto max-h-[70vh]"
      >
        <div
          className="w-full relative"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {virtualItems.map((virtualItem) => {
            const item = data[virtualItem.index];
            return (
              <div
                key={item.id}
                className="absolute top-0 left-0 w-full" // Removed p-2 from here
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Card
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "h-full flex flex-col mx-2", // Added margin here instead of padding on parent
                    onRowClick && "cursor-pointer transition-shadow hover:shadow-md"
                  )}
                >
                  <CardHeader className="p-4 pb-2">
                    {titleColumn && <CardTitle className="text-lg truncate">{String(item[titleColumn.key])}</CardTitle>}
                  </CardHeader>
                  <CardContent className="p-4 pt-2 flex-grow">
                    <div className="space-y-2 text-sm">
                      {contentColumns.map((column) => (
                        <div key={String(column.key)} className="flex justify-between items-center border-t pt-2 first:border-t-0 first:pt-0">
                          <span className="font-semibold text-muted-foreground">{column.header}:</span>
                          <span className="text-right">
                            {column.render ? column.render(item[column.key]) : String(item[column.key])}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // --- Desktop Table View (Virtualized) ---
  return (
    <div ref={parentRef} className="rounded-md border mt-4 overflow-y-auto max-h-[70vh]">
      <Table className="table-fixed">
        <TableHeader className="sticky top-0 z-10 bg-background">
          <TableRow>
            {columns.map((column) => (
              <TableHead key={String(column.key)}>{column.header}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative' }}>
          {virtualItems.map((virtualRow) => {
            const item = data[virtualRow.index];
            return (
              <TableRow
                key={item.id}
                data-index={virtualRow.index}
                onClick={() => handleItemClick(item)}
                className={cn(
                  "absolute", // Removed w-full
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  width: '100%' // Set width in style for absolutely positioned tr
                }}
              >
                {columns.map((column, colIndex) => {
                  const cellContent = column.render ? column.render(item[column.key]) : String(item[column.key]);
                  return (
                    <TableCell key={String(column.key)} className="truncate">
                      {onRowClick && colIndex === 0 ? (
                        <span className="font-semibold text-teal-700">{cellContent}</span>
                      ) : (
                        cellContent
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}