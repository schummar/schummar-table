import type { BenchOptions, BenchRegistration, TestContext } from 'vite-plus/test';

export type BenchCases = Record<string, () => unknown>;

const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;

/** Set to record a version; recording again under the same name overwrites it. */
const version: string | undefined = env['VITE_BENCH_VERSION'];

/** Comma-separated versions to show alongside the current run. */
const baselines: string[] = env['VITE_BENCH_BASELINE']?.split(',').filter(Boolean) ?? [];

/** Names become path segments, and contain spaces, commas, dots and parens. */
function slug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

export async function benchGroup(
  { bench, task }: TestContext,
  cases: BenchCases,
  options: BenchOptions = {},
): Promise<void> {
  const group = slug(task.fullTestName);
  const file = (v: string, name: string) => `.bench/${slug(v)}/${group}/${slug(name)}.json`;

  for (const [name, fn] of Object.entries(cases)) {
    const entries: BenchRegistration<string>[] = baselines.map((v) =>
      bench.from(`${name} [${v}]`, file(v, name)),
    );

    entries.push(
      bench(name, { ...options, ...(version && { writeResult: file(version, name) }) }, fn),
    );

    // UI iterations take milliseconds, not nanoseconds: bound the run by time, not a sample count.
    const runOptions = { time: 3000, iterations: 5, warmupIterations: 2 };

    if (entries.length > 1) {
      await bench.compare(...entries, runOptions);
    } else {
      await entries[0]!.run(runOptions);
    }
  }
}
