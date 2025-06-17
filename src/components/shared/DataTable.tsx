
// src/components/shared/DataTable.tsx
"use client";

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

export interface ColumnDef<T> {
  key: keyof T;
  header: string;
  render?: (value: any) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
}

export function DataTable<T extends { id: string | number }>({ data, columns }: DataTableProps<T>) {
  const isMobile = useIsMobile();

  // On mobile, render a list of cards
  if (isMobile) {
    if (!data.length) {
      return (
        <div className="text-center p-8 bg-gray-50 rounded-lg border mt-4">
          <p className="text-gray-600">No results.</p>
        </div>
      );
    }

    // Assumption: The first column is the primary identifier for the card title.
    const titleColumn = columns[0];
    const contentColumns = columns.length > 1 ? columns.slice(1) : [];

    return (
      <div className="space-y-4 mt-4">
        {data.map((item) => (
          <Card key={item.id}>
            <CardHeader className="p-4 pb-2">
              {titleColumn && <CardTitle className="text-lg">{String(item[titleColumn.key])}</CardTitle>}
            </CardHeader>
            <CardContent className="p-4 pt-2">
              <div className="space-y-2 text-sm">
                {contentColumns.map((column) => (
                  <div key={String(column.key)} className="flex justify-between items-center border-t pt-2 first:border-t-0 first:pt-0">
                    <span className="font-semibold text-muted-foreground">{column.header}:</span>
                    <span className="text-right">
                      {column.render
                        ? column.render(item[column.key])
                        : String(item[column.key])}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // On desktop, render the table
  return (
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
          {data.length ? (
            data.map((item) => (
              <TableRow key={item.id}>
                {columns.map((column) => (
                  <TableCell key={String(column.key)}>
                    {column.render
                      ? column.render(item[column.key])
                      : String(item[column.key])}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}