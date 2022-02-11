#!/usr/bin/env zx
import 'zx/globals';
import { readFile } from 'fs/promises';

$.verbose = false;
const entryPoints = [
  //
  'src/index.ts',
  'src/theme/mui5Theme/index.tsx',
  'src/theme/mui4Theme/index.tsx',
];
const formats = ['esm', 'cjs'];

const pkg = JSON.parse(await readFile('package.json', 'utf-8'));

await $`rimraf dist/**`;

const tasks = [
  ...formats.map(
    (format) =>
      $`npx esbuild ${entryPoints} ${[
        `--format=${format}`,
        `--outdir=dist/${format}`,
        `--bundle`,
        // `--minify`,
        // '--inject:./scripts/shim.js',
        // '--jsx-factory=jsx',
        ...Object.keys(pkg.peerDependencies).map((dep) => `--external:${dep}`),
      ]}`,
  ),

  $`tsc`,
];

await Promise.all(
  tasks.map(async (task) => {
    const output = await task;

    console.log(output.stderr || output.stdout);
  }),
);
