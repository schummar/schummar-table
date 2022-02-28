import react from '@vitejs/plugin-react';
import { isAbsolute } from 'path';
import { defineConfig } from 'vite';

// https://vitejs.dev/config/

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
    }),
  ],

  build: {
    sourcemap: true,
    minify: false,

    lib: {
      // entry: {
      //   index: 'src/index.ts',
      //   mui5Theme: 'src/theme/mui5Theme/index.tsx',
      //   mui4Theme: 'src/theme/mui4Theme/index.tsx',
      // },
      entry: './src/index.ts',
      formats: ['es', 'cjs'],
    },

    rollupOptions: {
      input: {
        index: './src/index.ts',
        mui5Theme: './src/theme/mui5Theme/index.tsx',
        mui4Theme: './src/theme/mui4Theme/index.tsx',
      },
      output: {
        entryFileNames: '[format]/[name].js',
        chunkFileNames: '[format]/[name].js',
      },
      external: (source) => {
        return !(isAbsolute(source) || source.startsWith('.'));
      },
    },
  },
});
