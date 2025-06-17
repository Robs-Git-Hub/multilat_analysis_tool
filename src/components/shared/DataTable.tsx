

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

  // Desktop virtualization only
  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 53, // Desktop table row height
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

  // --- Mobile Card View (Non-Virtualized for better content display) ---
  if (isMobile) {
    const titleColumn = columns[0];
    const contentColumns = columns.length > 1 ? columns.slice(1) : [];

    console.log('Mobile Card Data:', {
      titleColumn: titleColumn?.header,
      contentColumnsCount: contentColumns.length,
      contentColumns: contentColumns.map(col => col.header)
    });

    return (
      <div className="mt-4 overflow-y-auto max-h-[70vh] px-2 space-y-3">
        {data.map((item, index) => {
          // Debug log for each card
          console.log(`Card ${index}:`, {
            item,
            titleValue: titleColumn ? item[titleColumn.key] : 'No title',
            contentData: contentColumns.map(col => ({ 
              header: col.header, 
              value: item[col.key] 
            }))
          });

          return (
            <Card
              key={item.id}
              onClick={() => handleItemClick(item)}
              className={cn(
                "flex flex-col",
                onRowClick && "cursor-pointer transition-shadow hover:shadow-md"
              )}
            >
              <CardHeader className="p-3 pb-2">
                {titleColumn && (
                  <CardTitle className="text-base font-semibold text-teal-700 break-words">
                    {String(item[titleColumn.key])}
                  </CardTitle>
                )}
              </CardHeader>
              <CardContent className="p-3 pt-1">
                <div className="space-y-3 text-sm">
                  {contentColumns.map((column, columnIndex) => {
                    const value = item[column.key];
                    const displayValue = column.render ? column.render(value) : String(value);
                    
                    console.log(`Card ${index}, Column ${columnIndex}:`, {
                      columnKey: column.key,
                      columnHeader: column.header,
                      rawValue: value,
                      displayValue
                    });
                    
                    return (
                      <div 
                        key={String(column.key)} 
                        className={cn(
                          "flex flex-col gap-1 py-2",
                          columnIndex > 0 && "border-t border-gray-100"
                        )}
                      >
                        <span className="font-medium text-muted-foreground text-xs">
                          {column.header}
                        </span>
                        <span className="font-medium text-gray-900 break-words">
                          {displayValue}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
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

