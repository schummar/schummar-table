import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json';

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
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `${format === 'es' ? 'esm' : format}/schummar-table.${format === 'es' ? 'mjs' : 'cjs'}`,
    },

    rollupOptions: {
      external: Object.keys(pkg.peerDependencies),
    },
  },
});
