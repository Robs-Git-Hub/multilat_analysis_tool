
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

  // Calculate dynamic height based on content for mobile
  const calculateMobileCardHeight = (item: T, columns: ColumnDef<T>[]) => {
    const baseHeight = 80; // Header height
    const rowHeight = 32; // Each data row height
    const padding = 32; // Card padding
    const contentRows = columns.length > 1 ? columns.length - 1 : 0; // Exclude title column
    return baseHeight + (contentRows * rowHeight) + padding;
  };

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: (index) => {
      if (isMobile) {
        // Calculate dynamic height based on actual content
        const item = data[index];
        return calculateMobileCardHeight(item, columns);
      }
      return 53; // Desktop table row height
    },
    overscan: 5,
  });

  const virtualItems = rowVirtualizer.getVirtualItems();

  // Debug logging for mobile
  React.useEffect(() => {
    if (isMobile && data.length > 0) {
      console.log('DataTable Mobile Debug:', {
        dataCount: data.length,
        columnsCount: columns.length,
        firstItem: data[0],
        columns: columns.map(col => ({ key: col.key, header: col.header }))
      });
    }
  }, [isMobile, data, columns]);

  if (!data.length) {
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

    console.log('Mobile Card Data:', {
      titleColumn: titleColumn?.header,
      contentColumnsCount: contentColumns.length,
      contentColumns: contentColumns.map(col => col.header)
    });

    return (
      <div
        ref={parentRef}
        className="mt-4 overflow-y-auto max-h-[70vh] px-2"
      >
        <div
          className="w-full relative"
          style={{ height: `${rowVirtualizer.getTotalSize()}px` }}
        >
          {virtualItems.map((virtualItem) => {
            const item = data[virtualItem.index];
            
            // Debug log for each card
            console.log(`Card ${virtualItem.index}:`, {
              item,
              titleValue: titleColumn ? item[titleColumn.key] : 'No title',
              contentData: contentColumns.map(col => ({ 
                header: col.header, 
                value: item[col.key] 
              }))
            });

            return (
              <div
                key={item.id}
                className="absolute top-0 left-0 w-full overflow-hidden"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                <Card
                  onClick={() => handleItemClick(item)}
                  className={cn(
                    "h-full flex flex-col mb-2",
                    onRowClick && "cursor-pointer transition-shadow hover:shadow-md"
                  )}
                >
                  <CardHeader className="p-3 pb-2 flex-shrink-0">
                    {titleColumn && (
                      <CardTitle className="text-base font-semibold text-teal-700 truncate">
                        {String(item[titleColumn.key])}
                      </CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="p-3 pt-1 flex-grow overflow-hidden">
                    <div className="space-y-2 text-sm">
                      {contentColumns.map((column, index) => {
                        const value = item[column.key];
                        const displayValue = column.render ? column.render(value) : String(value);
                        
                        return (
                          <div 
                            key={String(column.key)} 
                            className={cn(
                              "flex justify-between items-start gap-2 py-1",
                              index > 0 && "border-t border-gray-100"
                            )}
                          >
                            <span className="font-medium text-muted-foreground flex-shrink-0 min-w-0">
                              {column.header}:
                            </span>
                            <span className="text-right font-medium text-gray-900 min-w-0 break-words">
                              {displayValue}
                            </span>
                          </div>
                        );
                      })}
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
      <Table className="table-fixed w-full">
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
                  "absolute flex w-full",
                  onRowClick && "cursor-pointer hover:bg-muted/50"
                )}
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {columns.map((column, colIndex) => {
                  const cellContent = column.render ? column.render(item[column.key]) : String(item[column.key]);
                  return (
                    <TableCell
                      key={String(column.key)}
                      className="truncate flex-1 py-4"
                    >
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
