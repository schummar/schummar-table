export type CsvExportOptions = { sepPrefix?: boolean; separator?: string; quote?: string; eol?: string };

export function csvExport(
  data: (string | number)[][],
  { sepPrefix, separator = ',', quote = '"', eol = '\n' }: CsvExportOptions = {},
): string {
  const cells = data.map((line) =>
    line.map((value) => {
      if (typeof value === 'number') return String(value);
      if (![separator, quote, eol].some((c) => value.includes(c))) return value;

      const clean = value.replace(new RegExp(quote, 'g'), `${quote}${quote}`);
      return `${quote}${clean}${quote}`;
    }),
  );

  return (sepPrefix ? `SEP=${separator}\n` : '') + cells.map((line) => line.join(separator)).join(eol);
}
