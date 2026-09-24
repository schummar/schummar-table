import { defineConfig } from 'vite-plus';
import { playwright } from 'vite-plus/test/browser-playwright';

export default defineConfig({
  staged: {
    '*': 'vp check --fix',
  },
  lint: {
    jsPlugins: [{ name: 'vite-plus', specifier: 'vite-plus/oxlint-plugin' }],
    rules: {
      'vite-plus/prefer-vite-plus-imports': 'error',
      // Flags emotion's destructured css/cx and debounced .cancel, which don't use this.
      'typescript/unbound-method': 'off',
    },
    options: { typeAware: true, typeCheck: true },
    ignorePatterns: ['dist', 'docs/storybook-static'],
  },
  fmt: {
    printWidth: 100,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: true,
    trailingComma: 'all',
    bracketSpacing: true,
    bracketSameLine: false,
    sortPackageJson: false,
    ignorePatterns: [
      'dist',
      'docs/storybook-static',
      '.claude',
      '.bench',
      'CHANGELOG.md',
      'pnpm-lock.yaml',
    ],
  },
  optimizeDeps: {
    // Discovering these mid-run reloads the browser and fails the first test file on a cold cache.
    include: ['vite-plus/test/browser/context', 'vitest-browser-react', '@mui/material'],
    rolldownOptions: {
      // Without it the prebundle inlines jsxDEV from React's production build, where it is `void 0`.
      transform: { define: { 'process.env.NODE_ENV': '"development"' } },
    },
  },
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
    benchmark: { include: ['src/bench/**/*.bench.{ts,tsx}'] },
    browser: {
      enabled: true,
      headless: true,
      provider: playwright({
        contextOptions: { permissions: ['clipboard-read', 'clipboard-write'] },
      }),
      instances: [{ browser: 'chromium' }],
      viewport: { width: 1280, height: 800 },
    },
  },
  pack: {
    deps: {
      // Keeps tsdown <0.23 behaviour for external subpath imports (e.g. @emotion/react/jsx-runtime).
      resolveDepSubpath: true,
    },
    clean: true,
    entry: {
      index: 'src/index.ts',
      mui5Theme: 'src/theme/mui5Theme/index.tsx',
      mui4Theme: 'src/theme/mui4Theme/index.tsx',
      csvExporter: 'src/exporters/csvExporter.ts',
      excelExporter: 'src/exporters/excelExporter.ts',
    },
    format: ['esm', 'cjs'],
    platform: 'neutral',
    publint: true,
    unused: true,
    dts: true,
    sourcemap: true,
    exports: true,
  },
});
