export interface StringExporter {
  type: string;
  exportToString(columns: (string | number | Date)[], rows: (string | number | Date)[][]): string;
}

export interface BlobExporter {
  type: string;
  fileEnding: string;
  exportToBlob(columns: (string | number | Date)[], rows: (string | number | Date)[][]): Blob;
}

export type Exporter = StringExporter | BlobExporter;

export type ExporterEntry =
  | { action: 'copy'; exporter: StringExporter }
  | { action: 'download'; exporter: BlobExporter };

export interface ExportOptions {
  exporters: ExporterEntry[];
  all?: boolean;
}
