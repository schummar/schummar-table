---
name: schummar-table-upgrade
description: Use when upgrading the schummar-table dependency from the 0.51.x line to a newer major version, or when the consumer's code hits errors/types referencing FunctionWithDeps, MemoizedTableTheme, subgrid, enableColumnReorder, configureTableTheme, initalRowHeight, throttleScroll, overscanTop, overscanBottom, useTableContext returning a store/getState()-only shape, table.useState, table.update, or TableResetContext.
---

# schummar-table upgrade (0.51.x -> current)

## Workflow

1. Find usages with the grep patterns listed under each section below (run from the consumer's project root, scoped to source directories, e.g. `grep -rn <pattern> src/`).
2. Go section by section, applying the before/after change to each match.
3. Flag anything needing human judgement (marked "needs human review" in each section) instead of guessing — leave a `// TODO(schummar-table-upgrade): ...` comment and list it in your final summary.
4. Re-run the project's type checker (`tsc --noEmit` or the project's usual command) and fix anything the automated edits missed.
5. Run the project's test suite. Pay particular attention to tests touching table rendering, virtualization, persisted state, and custom row/cell wrappers.
6. Summarize: files changed, what was auto-fixed, what was flagged for human review.

New breaking changes are appended below as new numbered sections — treat this list as append-only and work through whichever sections apply to the version being upgraded to.

---

## 1. React peer dependency now `>=19`

Check the consumer's `react`/`react-dom` versions. Upgrade if needed before proceeding; the rest of this migration assumes React 19.

## 2. Dependency tuples `[fn, ...deps]` removed

Grep: `grep -rn '\[\s*(async\s*)?\(' src/` (broad — narrow to file/prop names below), or more targeted:
`grep -rnE '(id|parentId|columnProps|wrapRow|wrapCell|rowAction|rowDetails|value|renderCell|filterBy)=\{\[' src/`

Affected: table `id`, `parentId`, `columnProps`, `wrapRow`, `wrapCell`, `rowAction`, `rowDetails`; column `value`, `renderCell`, `sortBy[]` entries; the `col(value, ...)` factory's first argument; filter `filterBy`; theme `classes.row/cell/details` and `styles.row/cell/details`.

Before:

```tsx
<Table id={[(item) => item.id, []]} rowAction={[(item) => <Action item={item} />, [item.id]]} />
```

After:

```tsx
<Table id={(item) => item.id} rowAction={(item) => <Action item={item} />} />
```

Just drop the wrapping array and the deps array — keep the function that was in position 0.

**Performance note (not a hard requirement):** functions are no longer auto-memoized (the old default memoized by `fn.toString()`, which could silently keep stale closures). A new function identity now triggers recompute/re-render like normal React. For large tables, memoize `columns`, `items`, and function props with `useMemo`/`useCallback` (or adopt the React Compiler) if you see unnecessary re-renders. Hoist a function out of the render body when it doesn't need to close over anything.

`FunctionWithDeps` and `MemoizedTableTheme` types are gone — remove any imports/usages of them (needs human review if the consumer built their own helpers around these types).

## 3. Column reorder removed

Grep: `grep -rn 'enableColumnReorder\|columnOrder' src/`

- Remove the `enableColumnReorder` prop wherever it's passed to `<Table>`.
- Remove `'columnOrder'` from any `persist.include` / `persist.exclude` array.
- Previously persisted column orders in storage are silently ignored now — no migration needed, but mention it to users if column order was a documented feature.

## 4. `subgrid` prop removed (always-on CSS subgrid)

Grep: `grep -rn 'subgrid' src/`

Remove the `subgrid` prop entirely — CSS subgrid is now always used. Every row (and the header/footer) is a real element with `grid-column: 1 / -1; display: grid; grid-template-columns: subgrid`, not `display: contents`.

**Needs human review:** any custom CSS that assumed cells are direct children of the table's grid container, or that targeted rows via `display: contents` (e.g. `.table > .row-child-selector`). Search for `display: contents` and any selectors referencing the table's row/cell DOM structure:
`grep -rn 'display:\s*contents' src/**/*.css src/**/*.ts src/**/*.tsx`

## 5. `virtual` option shape changed

Grep: `grep -rn 'initalRowHeight\|throttleScroll\|overscanTop\|overscanBottom' src/`

`virtual` is now `boolean | { rowHeight?: number; estimatedRowHeight?: number; overscan?: number }`. Same shape applies to `SelectFilter`'s `virtual` prop.

- `initalRowHeight` → `estimatedRowHeight` (default 40).
- `throttleScroll`, `overscanTop`, `overscanBottom` are removed — no direct replacement.
- `overscan` now counts rows (default 5), previously pixels (default 100). Recompute a sensible row-based value instead of porting the old pixel number directly.

Before:

```tsx
<Table
  virtual={{ initalRowHeight: 48, throttleScroll: 100, overscanTop: 200, overscanBottom: 200 }}
/>
```

After:

```tsx
<Table virtual={{ estimatedRowHeight: 48, overscan: 5 }} />
```

Virtualization is now powered by `@tanstack/react-virtual` — if the consumer relied on implementation details of the old virtualizer (e.g. specific DOM structure, scroll event timing), needs human review.

## 6. `wrapRow` must spread `props`

Grep: `grep -rn 'wrapRow' src/`

`wrapRow(props, item, index)` — `props` (type `WrapRowProps`) now includes `ref` and `data-index`. The wrapper **must** spread `props` onto the row element, or that row won't be measured by the virtualizer and will use the estimated height (visible as jumpy/misaligned rows).

Before (still compiles, but broken):

```tsx
wrapRow={(props, item) => <Link to={`/items/${item.id}`}>{props.children}</Link>}
```

After:

```tsx
wrapRow={(props, item) => <Link to={`/items/${item.id}`} {...props} />}
```

**Needs human review:** every `wrapRow` implementation — check it spreads `props` (or at minimum forwards `ref`, `data-index`, `className`, and `style`) onto the actual row DOM element.

## 7. `configureTableTheme` removed

Grep: `grep -rn 'configureTableTheme' src/`

Global theme configuration is gone. Wrap the app in `<TableSettingsProvider theme={...}>` instead.

Before:

```tsx
configureTableTheme(myTheme);
```

After:

```tsx
<TableSettingsProvider theme={myTheme}>
  <App />
</TableSettingsProvider>
```

## 8. `useTableContext()` returns plain state + actions

Grep: `grep -rn 'useTableContext\|\.useState(\|\.getState(\|\.update(\|TableResetContext' src/`

`useTableContext()` no longer returns a store. It returns a plain object (type `TableContextValue`) with fields — `props`, `displaySize`, `sort`, `selection`, `expanded`, `hiddenColumns`, `columnWidths`, `filters`, `filterValues`, `columns`, `activeColumns`, `visibleColumns`, `items`, `itemsById`, `activeItems`, `activeItemsById` — plus `actions`.

- `table.useState(selector)` → destructure the field directly from `useTableContext()`.
- `table.update(...)` → call the matching method on `actions`: `actions.setSort`, `actions.setSelection`, `actions.toggleSelection`, `actions.setExpanded`, `actions.toggleExpanded`, `actions.setHiddenColumns`, `actions.setColumnWidth`, `actions.setFilterValue`, `actions.clearFilters`, `actions.resetTable`.
- `table.getState()` → `actions.getState()` (for reading latest state inside event handlers, where a plain destructure from render would be stale).
- `TableResetContext` → `actions.resetTable()`.
- New `useTableActions()` hook returns just the stable `actions` object, useful when a component only needs to dispatch and shouldn't re-render on every state change.
- Type `InternalTableState` is renamed to `TableState`.
- **Performance:** there is no selector, and the `useTableContext()` value changes on every table state change (including selection and expansion). Components rendered per row or per cell (custom `renderCell` content, `rowAction`, `wrapCell`) should not call it, or they re-render on every interaction. Use `useTableActions()` to dispatch, and `useTableStructure()` (type `TableStructure`: the same fields without `selection`, `expanded`, `activeItems`, `activeItemsById`) for header- or filter-level components.

Before:

```tsx
const table = useTableContext();
const sort = table.useState((s) => s.sort);
table.update((s) => ({ ...s, sort: newSort }));

const reset = useContext(TableResetContext);
reset();
```

After:

```tsx
const { sort, actions } = useTableContext();
actions.setSort(newSort);

actions.resetTable();
```

**Needs human review:** any selector passed to the old `table.useState` that combined/derived multiple fields — replace with reading the individual fields and deriving locally (e.g. with `useMemo`), since there's no built-in selector mechanism anymore.

## 9. `TableItem` gained `depth: number`

No action needed for most consumers. If code narrows or reconstructs `TableItem` objects manually (e.g. in tests or mocks), add the `depth` field.

## 10. `useFilter` unchanged, but timing note

`useFilter` (custom filters) keeps its existing API — no signature changes. One behavioral note: filter implementation functions (`test`, `isActive`, `filterBy`) are read when filtering runs; changing only those functions (new identity, same behavior otherwise) does not itself trigger re-filtering. If a custom filter needs to re-run when one of these functions' _closed-over values_ change, make sure that value is also reflected in the filter's `value`/dependency the table already re-filters on — don't rely on function identity alone.

## 11. `debugRender` messages changed

`debugRender` now reports `'render table'`, `'render row', id` and `'render cell', columnId`. `'render table inner'` and `'Virtualized render …'` are gone. Update render-count tests that match on these strings.

<!-- Append new dated sections here for future breaking changes, following the same grep / before-after / needs-human-review structure. -->
