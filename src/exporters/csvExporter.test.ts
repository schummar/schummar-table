import { describe, expect, test } from 'vite-plus/test';
import CsvExporter from './csvExporter';

describe('exportToString', () => {
  test('joins header and rows with tab separator and newline eol by default', () => {
    const exporter = new CsvExporter();
    const result = exporter.exportToString(
      ['Name', 'Age'],
      [
        ['Alice', 30],
        ['Bob', 40],
      ],
    );
    expect(result).toBe('Name\tAge\nAlice\t30\nBob\t40');
  });

  test('uses a custom separator', () => {
    const exporter = new CsvExporter({ separator: ',' });
    const result = exporter.exportToString(['Name', 'Age'], [['Alice', 30]]);
    expect(result).toBe('Name,Age\nAlice,30');
  });

  test('uses a custom eol', () => {
    const exporter = new CsvExporter({ eol: '\r\n' });
    const result = exporter.exportToString(['Name'], [['Alice'], ['Bob']]);
    expect(result).toBe('Name\r\nAlice\r\nBob');
  });

  test('quotes a value containing the separator', () => {
    const exporter = new CsvExporter({ separator: ',' });
    const result = exporter.exportToString(['Name'], [['Doe, John']]);
    expect(result).toBe('Name\n"Doe, John"');
  });

  test('quotes and escapes a value containing the quote character', () => {
    const exporter = new CsvExporter({ separator: ',' });
    const result = exporter.exportToString(['Name'], [['5" nail']]);
    expect(result).toBe('Name\n"5"" nail"');
  });

  test('quotes a value containing the eol', () => {
    const exporter = new CsvExporter();
    const result = exporter.exportToString(['Name'], [['multi\nline']]);
    expect(result).toBe('Name\n"multi\nline"');
  });

  test('supports a custom quote character', () => {
    const exporter = new CsvExporter({ separator: ',', quote: "'" });
    const result = exporter.exportToString(['Name'], [['Doe, John']]);
    expect(result).toBe("Name\n'Doe, John'");
  });

  test('serializes numbers as-is', () => {
    const exporter = new CsvExporter();
    const result = exporter.exportToString(['Value'], [[42]]);
    expect(result).toBe('Value\n42');
  });

  test('leaves plain string values untouched', () => {
    const exporter = new CsvExporter();
    const result = exporter.exportToString(['Name'], [['Alice']]);
    expect(result).toBe('Name\nAlice');
  });

  test('prepends a SEP= prefix when sepPrefix is set', () => {
    const exporter = new CsvExporter({ sepPrefix: true, separator: ';' });
    const result = exporter.exportToString(['Name'], [['Alice']]);
    expect(result).toBe('SEP=;\nName\nAlice');
  });

  test('per-call options override the constructor options', () => {
    const exporter = new CsvExporter({ separator: '\t' });
    const result = exporter.exportToString(['Name', 'Age'], [['Alice', 30]], { separator: ',' });
    expect(result).toBe('Name,Age\nAlice,30');
  });

  test('handles empty rows', () => {
    const exporter = new CsvExporter();
    const result = exporter.exportToString(['Name'], []);
    expect(result).toBe('Name');
  });

  // Bug: when a Date value needs no escaping, exportToString returns the original Date
  // object instead of its ISO string, so Array.join later stringifies it with
  // Date.prototype.toString() (locale/timezone-dependent) rather than toISOString().
  // src/exporters/csvExporter.ts:35
  test.fails('serializes dates using toISOString', () => {
    const exporter = new CsvExporter();
    const date = new Date(2024, 0, 15, 10, 30, 0);
    const result = exporter.exportToString(['Date'], [[date]]);
    expect(result).toBe(`Date\n${date.toISOString()}`);
  });
});

describe('exportToBlob', () => {
  test('produces a csv blob', () => {
    const exporter = new CsvExporter();
    const blob = exporter.exportToBlob(['Name'], [['Alice']]);
    expect(blob.type).toBe('text/csv');
  });

  test('defaults sepPrefix to true, unlike exportToString', async () => {
    const exporter = new CsvExporter();
    const blob = exporter.exportToBlob(['Name'], [['Alice']]);
    const text = await blob.text();
    expect(text).toBe('SEP=\t\nName\nAlice');
  });

  test('respects an explicit sepPrefix: false', async () => {
    const exporter = new CsvExporter({ sepPrefix: false });
    const blob = exporter.exportToBlob(['Name'], [['Alice']]);
    const text = await blob.text();
    expect(text).toBe('Name\nAlice');
  });
});
