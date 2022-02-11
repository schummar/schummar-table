import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-refresh';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  esbuild: {
    jsxFactory: `jsx`,
    jsxInject: `import { jsx } from '@emotion/react'`,
  },

  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'foo',
      fileName: (format) => `foo-${format}.js`,
      formats: ['es', 'cjs'],
    },
    rollupOptions: {
      external: ['react', 'react-dom'],
    },
  },
});
