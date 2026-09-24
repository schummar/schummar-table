import { describe, expect, test } from 'vite-plus/test';
import ExcelExporter from './excelExporter';

describe('ExcelExporter', () => {
  test('exports strings, numbers and dates as an xlsx file', async () => {
    const blob = await new ExcelExporter().exportToBlob(
      ['Name', 'Age', 'Birthday'],
      [
        ['Alice', 30, new Date(1990, 0, 1)],
        ['Bob', 25, new Date(1995, 5, 15)],
      ],
    );

    expect(blob.size).toBeGreaterThan(0);
    // xlsx files are zip archives.
    const signature = new Uint8Array(await blob.slice(0, 2).arrayBuffer());
    expect(String.fromCharCode(...signature)).toBe('PK');
  });
});
