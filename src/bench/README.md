# Benchmarks

Vitest 5 benchmarks, run in browser mode (Playwright Chromium) against the sources. Absolute
numbers depend on the machine; compare only against versions recorded on the same machine.

```bash
pnpm bench                                          # run everything
VITE_BENCH_VERSION=after pnpm bench                 # run and record as version "after"
VITE_BENCH_BASELINE=before pnpm bench               # show "before" next to the current numbers
VITE_BENCH_BASELINE=before,after pnpm bench         # ... or several versions at once
pnpm exec vp test bench --run -t 'interaction'      # filter by group name
```

Results live in `.bench/<version>/<group>/<benchmark>.json`. `.bench/local/` is git-ignored for
throwaway runs; any other version is committed.

| Version  | What it is                                                                      |
| -------- | ------------------------------------------------------------------------------- |
| `before` | v0.51 architecture (schummar-state store, per-cell subscriptions)               |
| `after`  | domain hooks + contexts, memo rows, TanStack Virtual, subgrid rows              |
| `round2` | stable prop/column references, single row mount in scroll containers            |
| `round3` | library styles as static prepended classes, no emotion `css` prop in rows/cells |

## Conventions

- One `test` is one group; `benchGroup` from `_baseline` wires up recording and baselines. The
  group's path comes from the test's full name, so renaming a `describe` or `test` orphans its
  recorded versions.
- Interactions click in-page (`element.click()`) rather than through `userEvent`, which would add
  the Playwright round trip to every sample.
- Each sample waits until the DOM reflects the change, polling per animation frame.
