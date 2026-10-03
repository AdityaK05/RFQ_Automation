"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ColumnDef<T> = {
  key: string;
  header: string;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
};

type DataTableProps<T> = {
  id?: string;
  columns: ColumnDef<T>[];
  data: T[];
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  selectedRowId?: string;
  getRowId?: (row: T) => string;
  className?: string;
};

export default function DataTable<T extends Record<string, unknown>>({
  id = "data-table",
  columns,
  data,
  emptyMessage = "No items to display",
  onRowClick,
  selectedRowId,
  getRowId,
  className = "",
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto rounded-xl border border-border bg-background", className)}>
      <table id={id} className="w-full text-left text-xs">
        <thead className="border-b border-border bg-card/70 text-muted-foreground">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn("px-4 py-2.5 font-medium tracking-wide", col.className)}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60">
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, index) => {
              const rowId = getRowId ? getRowId(row) : (row.id as string) || String(index);
              const isSelected = selectedRowId === rowId;
              const isClickable = Boolean(onRowClick);

              return (
                <tr
                  key={rowId}
                  onClick={() => onRowClick?.(row)}
                  className={cn(
                    "transition-colors",
                    isClickable && "cursor-pointer hover:bg-card/60",
                    isSelected && "bg-blue-600/10 font-medium"
                  )}
                >
                  {columns.map((col) => (
                    <td key={col.key} className={cn("px-4 py-3 text-foreground", col.className)}>
                      {col.render ? col.render(row, index) : (row[col.key] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
