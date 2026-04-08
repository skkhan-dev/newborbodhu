"use client";

import { type ReactNode } from "react";

export type DataTableColumn<T> = {
  key: string;
  label: string;
  sortable?: boolean;
  render?: (row: T) => ReactNode;
  width?: string;
};

export function DataTable<T extends Record<string, unknown>>({
  columns,
  rows,
  sortKey,
  sortDir,
  onSort,
  onRowClick,
  emptyMessage = "No data found.",
  keyExtractor,
}: {
  columns: DataTableColumn<T>[];
  rows: T[];
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
  keyExtractor?: (row: T) => string;
}) {
  function getKey(row: T, index: number) {
    if (keyExtractor) return keyExtractor(row);
    if ("id" in row) return String(row.id);
    return String(index);
  }

  function handleSort(col: DataTableColumn<T>) {
    if (col.sortable && onSort) onSort(col.key);
  }

  return (
    <div className="data-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`data-table-th${col.sortable ? " data-table-sortable" : ""}${sortKey === col.key ? " data-table-sorted" : ""}`}
                style={col.width ? { width: col.width } : undefined}
                onClick={() => handleSort(col)}
              >
                {col.label}
                {col.sortable && sortKey === col.key && (
                  <span className="data-table-sort-icon">
                    {sortDir === "asc" ? " ↑" : " ↓"}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="data-table-empty"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row, i) => (
              <tr
                key={getKey(row, i)}
                className={`data-table-row${onRowClick ? " data-table-row-clickable" : ""}`}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td key={col.key} className="data-table-td">
                    {col.render
                      ? col.render(row)
                      : (row[col.key] as ReactNode) ?? "—"}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
