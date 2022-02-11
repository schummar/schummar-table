import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import pkg from './package.json';

// https://vitejs.dev/config/

const formats = ['esm', 'cjs'] as const;

export default defineConfig({
  plugins: [
    react({
      jsxImportSource: `@emotion/react`,
    }),
  ],

  build: {
    rollupOptions: {
      input: {
        'schummar-table': 'src/index.ts',
        mui5Theme: 'src/theme/mui5Theme/index.tsx',
      },

      output: formats.map((format) => ({
        format,
        entryFileNames: ({ name }) => `${name}.${format}.js`,
      })),

      external: Object.keys(pkg.peerDependencies),
    },
  },
});
