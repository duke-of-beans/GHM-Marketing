/**
 * CSV Export Utilities
 */

export type ExportColumn<T = any> = {
  key: keyof T | string;
  label: string;
  format?: (value: any, row: T) => string;
};

/**
 * Convert data to CSV format
 */
export function convertToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[]
): string {
  if (data.length === 0) return "";

  // Header row
  const headers = columns.map((col) => `"${col.label}"`).join(",");

  // Data rows
  const rows = data.map((row) => {
    return columns
      .map((col) => {
        const value = (row as any)[col.key];
        const formatted = col.format ? col.format(value, row) : value;
        
        // Escape quotes and wrap in quotes
        const escaped = String(formatted ?? "")
          .replace(/"/g, '""');
        
        return `"${escaped}"`;
      })
      .join(",");
  });

  return [headers, ...rows].join("\n");
}

/**
 * Download CSV file
 */
export function downloadCSV(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}

/**
 * Export data to CSV and trigger download
 */
export function exportToCSV<T>(
  data: T[],
  columns: ExportColumn<T>[],
  filename: string
) {
  const csv = convertToCSV(data, columns);
  downloadCSV(csv, filename);
}

/**
 * Common formatters
 */
export const formatters = {
  date: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleDateString();
  },
  
  dateTime: (value: any) => {
    if (!value) return "";
    return new Date(value).toLocaleString();
  },
  
  currency: (value: any) => {
    if (!value) return "$0";
    return `$${Number(value).toLocaleString(undefined, { 
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  },
  
  percent: (value: any) => {
    if (!value) return "0%";
    return `${Number(value).toFixed(2)}%`;
  },
  
  boolean: (value: any) => {
    return value ? "Yes" : "No";
  },
};
