import ExcelJS from 'exceljs';
import iconv from 'iconv-lite';
import { Buffer } from 'buffer';

// Polyfill Buffer for browser environment
if (typeof window !== 'undefined') {
  (window as any).Buffer = Buffer;
}

export interface ExportOptions {
  filename: string;
  format: 'csv' | 'xlsx' | 'json';
  encoding: 'utf-8' | 'windows-1252';
  delimiter: ',' | ';' | '\t';
  includeHeaders: boolean;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  filename: 'export_data',
  format: 'csv',
  encoding: 'utf-8',
  delimiter: ',',
  includeHeaders: true,
};

export const PRESETS: Record<string, ExportOptions> = {
  'AS400_Standard': {
    filename: 'export_as400',
    format: 'csv',
    encoding: 'windows-1252',
    delimiter: ';',
    includeHeaders: false,
  },
  'Excel_Clean': {
    filename: 'export_clean',
    format: 'xlsx',
    encoding: 'utf-8',
    delimiter: ',',
    includeHeaders: true,
  },
  'Web_JSON': {
    filename: 'export_api',
    format: 'json',
    encoding: 'utf-8',
    delimiter: ',',
    includeHeaders: true,
  }
};

export const generateExport = async (rows: any[], columns: { name: string }[], options: ExportOptions) => {
  const { filename, format, encoding, delimiter, includeHeaders } = options;
  const fullFilename = `${filename}.${format}`;

  if (format === 'xlsx') {
    await exportExcel(rows, columns, fullFilename);
  } else if (format === 'json') {
    exportJSON(rows, fullFilename);
  } else {
    exportCSV(rows, columns, fullFilename, encoding, delimiter, includeHeaders);
  }
};

const triggerDownload = (blob: Blob, filename: string) => {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const exportExcel = async (rows: any[], columns: { name: string }[], filename: string) => {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Data');

  // Add Headers
  sheet.columns = columns.map(c => ({ header: c.name, key: c.name }));

  // Add Rows
  sheet.addRows(rows);

  // Write
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  triggerDownload(blob, filename);
};

const exportJSON = (rows: any[], filename: string) => {
  const jsonStr = JSON.stringify(rows, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  triggerDownload(blob, filename);
};

const exportCSV = (
  rows: any[], 
  columns: { name: string }[], 
  filename: string, 
  encoding: 'utf-8' | 'windows-1252', 
  delimiter: string,
  includeHeaders: boolean
) => {
  // 1. Build CSV String
  const headerRow = columns.map(c => `"${c.name}"`).join(delimiter);
  const dataRows = rows.map(row => {
    return columns.map(col => {
      const val = row[col.name];
      const strVal = val === null || val === undefined ? '' : String(val);
      // Escape quotes: simple regex for global replacement
      return `"${strVal.split('"').join('""')}"`;
    }).join(delimiter);
  });

  const csvContent = (includeHeaders ? [headerRow, ...dataRows] : dataRows).join('\n');

  // 2. Handle Encoding
  let blob: Blob;
  if (encoding === 'windows-1252') {
    // Use iconv-lite to encode
    const buffer = iconv.encode(csvContent, 'win1252');
    blob = new Blob([buffer], { type: 'text/csv;charset=windows-1252' });
  } else {
    // UTF-8 with BOM for Excel compatibility
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8' });
  }

  triggerDownload(blob, filename);
};
