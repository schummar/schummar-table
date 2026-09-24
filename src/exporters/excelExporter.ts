import writeXlsxFile from 'write-excel-file/browser';
import type { BlobExporter } from './exporter';

export interface ExcelExporterOptions {
  /** Excel number format for date cells.
   * @default 'yyyy-mm-dd'
   */
  dateFormat?: string;
  /** @default 'Sheet1' */
  sheet?: string;
}

export default class ExcelExporter implements BlobExporter {
  readonly type = 'xlsx';
  readonly fileEnding = 'xlsx';

  constructor(private readonly options: ExcelExporterOptions = {}) {}

  exportToBlob(
    columns: (string | number | Date)[],
    rows: (string | number | Date)[][],
  ): Promise<Blob> {
    const { dateFormat = 'yyyy-mm-dd', sheet = 'Sheet1' } = this.options;
    return writeXlsxFile([columns, ...rows], { sheet, dateFormat }).toBlob();
  }
}
