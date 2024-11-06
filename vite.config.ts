import path from 'path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
      babel: {
        plugins: ['@emotion/babel-plugin'],
      },
    }),
  ],

  build: {
    sourcemap: true,
    minify: false,

    lib: {
      entry: {
        index: 'src/index.ts',
        mui5Theme: 'src/theme/mui5Theme/index.tsx',
        mui4Theme: 'src/theme/mui4Theme/index.tsx',
        csvExporter: 'src/exporters/csvExporter.ts',
        excelExporter: 'src/exporters/excelExporter.ts',
      },
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      output: {
        entryFileNames: '[format]/[name].js',
        chunkFileNames: '[format]/[name].js',
      },
      external: (source) => {
        return (
          !source.includes('schummar-state') && !(path.isAbsolute(source) || source.startsWith('.'))
        );
      },
    },
  },

  esbuild: {
    logOverride: { 'this-is-undefined-in-esm': 'silent' },
  },
});
