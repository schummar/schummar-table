import { utils, write } from 'xlsx';
import { BlobExporter } from './exporter';

export default class ExcelExporter implements BlobExporter {
  readonly type = 'xlsx';
  readonly fileEnding = 'xlsx';

  exportToBlob(columns: (string | number | Date)[], rows: (string | number | Date)[][]): Blob {
    const worksheet = utils.aoa_to_sheet([columns, ...rows]);
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const data = write(workbook, { type: 'buffer' });
    return new Blob([data], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }
}
