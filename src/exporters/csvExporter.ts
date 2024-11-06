import { BlobExporter, StringExporter } from './exporter';

export interface CsvExporterOptions {
  sepPrefix?: boolean;
  separator?: string;
  quote?: string;
  eol?: string;
}

export default class CsvExporter implements StringExporter, BlobExporter {
  readonly type = 'csv';
  readonly fileEnding = 'csv';

  constructor(public readonly options: CsvExporterOptions = {}) {}

  exportToString(
    columns: (string | number | Date)[],
    rows: (string | number | Date)[][],
    options = this.options,
  ): string {
    const { sepPrefix, separator = '\t', quote = '"', eol = '\n' } = options;

    const cells = [columns, ...rows].map((line) =>
      line.map((value) => {
        let stringValue: string;
        if (typeof value === 'number') {
          stringValue = String(value);
        } else if (value instanceof Date) {
          stringValue = value.toISOString();
        } else {
          stringValue = value;
        }

        if (![separator, quote, eol].some((c) => stringValue.includes(c))) {
          return value;
        }

        const clean = stringValue.replace(new RegExp(quote, 'g'), `${quote}${quote}`);
        return `${quote}${clean}${quote}`;
      }),
    );

    return (
      (sepPrefix ? `SEP=${separator}\n` : '') + cells.map((line) => line.join(separator)).join(eol)
    );
  }

  exportToBlob(columns: (string | number | Date)[], rows: (string | number | Date)[][]): Blob {
    const data = this.exportToString(columns, rows, {
      ...this.options,
      sepPrefix: this.options.sepPrefix ?? true,
    });
    return new Blob([data], { type: 'text/csv' });
  }
}
