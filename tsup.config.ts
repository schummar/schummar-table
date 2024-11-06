import { defineConfig } from 'tsup';

export default defineConfig({
  clean: true,
  entry: {
    index: 'src/index.ts',
    mui5Theme: 'src/theme/mui5Theme/index.tsx',
    mui4Theme: 'src/theme/mui4Theme/index.tsx',
    csvExporter: 'src/exporters/csvExporter.ts',
    excelExporter: 'src/exporters/excelExporter.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
});
