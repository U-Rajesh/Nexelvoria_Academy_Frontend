/**
 * Client-side CSV for data already loaded from the server (RFC 4180 quoting,
 * UTF-8 BOM so Excel reads non-ASCII names, formula injection neutralised).
 * Server-generated exports (reportsService.exportReport) are preferred for reports.
 */
const field = (v: unknown): string => {
  if (v === null || v === undefined) return '';
  let s = String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadCsv(fileName: string, headers: string[], rows: unknown[][]): void {
  const text = [headers, ...rows].map((r) => r.map(field).join(',')).join('\r\n');
  const blob = new Blob([`﻿${text}\r\n`], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
