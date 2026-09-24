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

`@emotion/react` (`^11.11.1`) is a peer dependency now too, so the table shares the app's emotion instance, cache and theme. Add it to the consumer's dependencies if it isn't there.

## 2. Dependency tuples `[fn, ...deps]` removed

Tuples appear as JSX props, as object properties and as the first argument of `col()`. Run all three:

```sh
grep -rnE '(id|parentId|columnProps|wrapRow|wrapCell|rowAction|rowDetails|value|renderCell|filterBy|row|cell|details)=\{\[' src/
grep -rnE '(id|parentId|columnProps|wrapRow|wrapCell|rowAction|rowDetails|value|renderCell|exportCell|filterBy|sortBy|row|cell|details):\s*\[' src/
grep -rnE '\bcol\(\s*\[' src/
```

The patterns are line-based: a tuple whose `[` is on the next line is missed. As a backstop, `grep -rnE '^\s*\[\s*(async\s*)?(\(|[a-zA-Z_]+\s*=>)' src/` finds lines that start a tuple, and the type checker reports whatever is left (a tuple is no longer assignable to a function).

Affected: table `id`, `parentId`, `columnProps`, `wrapRow`, `wrapCell`, `rowAction`, `rowDetails`; column `value`, `renderCell`, `sortBy[]` entries, `filterBy` (now a column property, formerly on the filter); the `col(value, ...)` factory's first argument; theme `classes.row/cell/details` and `styles.row/cell/details`.

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

The header and footer rows are now the sticky elements, not their cells: see section 14. Offsets on `headerCell`/`footerCell` styles break silently.

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

`props.ref` is a `RefCallback<HTMLElement> | null`, so it can be spread onto any element, including an `<a>`-based `Link`. If the installed version still types it as `Ref<HTMLDivElement>` (early 1.0 betas), cast it: `ref={props.ref as Ref<HTMLAnchorElement>}`. A `Link` component that doesn't forward `ref` to its DOM element can't be measured either.

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

## 10. Filters are descriptors, filter values are table state

Filter components are replaced by factories returning a plain descriptor. The filter UI only mounts while its popover is open.

`grep -rnE '<(TextFilter|SelectFilter|RangeFilter|DateFilter|CombinedFilter)\b|useFilter\b|FilterImplementation|CommonFilterProps|(substring|prefix|exact)Compare' src/`

Before → after:

```tsx
filter: <TextFilter />                                  filter: textFilter()
filter: <TextFilter compare={prefixCompare} />          filter: textFilter({ compare: 'prefix' })
filter: <TextFilter compare={substringCompare} />       filter: textFilter({ compare: 'contains' })
filter: <TextFilter compare={exactCompare} />           filter: textFilter({ compare: 'exact' })
filter: <TextFilter compare={(a, b) => …} />            filter: textFilter({ compare: (a, b) => … })
filter: <SelectFilter singleSelect virtual={false} />   filter: selectFilter({ singleSelect: true, virtual: false })
filter: <RangeFilter min={0} />                         filter: rangeFilter({ min: 0 })
filter: <DateFilter maxDate={d} defaultValue={r} />     filter: dateFilter({ maxDate: d, defaultValue: r })
```

Every prop becomes an option of the same name, except `filterBy`: it moved to the column.

```tsx
// before
col((x) => x.birthday, { filter: <RangeFilter filterBy={(d: Date) => d.getFullYear()} /> });
// after
col((x) => x.birthday, { filterBy: (d) => d.getFullYear(), filter: rangeFilter() });
```

**Custom column helpers need the filter type parameter.** `Column` is now `Column<TItem, TColumnValue, TFilterBy = TColumnValue>`. A wrapper typed with only the first two, e.g. `function myCol<T, V>(…): Column<T, V>`, pins the filter input to the column value, so a `filterBy` returning another type is rejected. Find them and thread a third parameter through:

`grep -rnE 'Column<|ColumnFactory<' src/`

```ts
function myCol<T, V, F = V>(
  value: (item: T) => V,
  column: Omit<Column<T, V, F>, 'value'>,
): Column<T, V, F>;
```

**Filters are type checked against the column.** A filter must accept the column value, or the `filterBy` result if given. What the built-in filters accept (each also as an array or `Set` of values: an item matches if one of them does):

- `textFilter`: `string | number | bigint | null | undefined`
- `selectFilter`: anything; typing `options`, `defaultValue` or `render` narrows it
- `rangeFilter`: `number | bigint | null | undefined`
- `dateFilter`: `Date | DateRange | ISODate | null | undefined`, where `ISODate` is a template literal type like `2024-05-03` or `2024-05-03T13:47:23Z`

Previously filters converted anything (text filters stringified dates and objects, date filters parsed any string or timestamp). New compile errors on `filter:` mean a conversion is needed: add a column `filterBy`, e.g. `filterBy: (d) => d.toISOString()` for a text filter on a `Date` column, or `filterBy: (s) => new Date(s)` for a date filter on a plain `string` column.

Keep options plain data where possible: inline filters are compared deeply with functions by reference, so an inline `compare`/`render` arrow makes the column change on every render (hoist it or let the compiler memoize it).

**Controlled values.** `value`, `onChange` and `defaultValue` stay as filter options, now typed against the filter's own value:

```tsx
// before
col((x) => x.first_name, {
  filter: <TextFilter external value={name} onChange={(v) => setName(v ?? '')} />,
});
// after
col((x) => x.first_name, {
  filter: textFilter({ external: true, value: name, onChange: (v) => setName(v ?? '') }),
});
```

- `value: undefined` leaves the filter to the table (uncontrolled). A filter's `value` wins over the table's `filterValues`.
- `onChange` fires on every change of that filter: its UI, clearing all filters, right-click reset, table reset and restoring persisted state. Its identity doesn't matter; an inline arrow doesn't cause refiltering.
- Filters with a controlled `value` are not persisted.

Additionally, the table can control all filter values at once: `filterValues` / `defaultFilterValues` / `onFilterValuesChange`, a `Map` from column id to filter value (give filtered columns an explicit `id`). A column without an entry uses its filter's `defaultValue`; a cleared filter has an entry with value `undefined`. Resetting the table reports through `onFilterValuesChange` only when `filterValues` is uncontrolled; with controlled `filterValues`, reset them in `onReset` (scope `'table'`) like you do for `sort`.

**`CombinedFilter` → `enableHiddenColumnFilters`.** Remove the `CombinedFilter` column filter and set `enableHiddenColumnFilters` on the table: a button in the header lists the filters of hidden columns (by display size or column selection) and keeps them applied.

**Hidden columns keep their filter value.** Previously hiding a column cleared its filter. Now the value is kept and ignored while the column is hidden (applied with `enableHiddenColumnFilters`). `actions.clearFilters()` clears all filters, hidden ones included.

**Custom filters.** `useFilter` is removed. Rewrite with `defineFilter`:

```tsx
const myFilter = defineFilter<SingleOrMultiple<string>, TState, MyOptions>({
  isActive: (state, options) => …,
  test: (state, input, options) => toSingles(input).some(…),   // helpers.toSingles
  debounce: 300,                          // optional default; a `debounce` option overrides it
  Component: ({ value, onChange, close, options, getValues }) => …,
});
// column: filterBy (optional), filter: myFilter({ …MyOptions, defaultValue, external })
```

The component no longer reads the table context for its value: it gets `value`/`onChange` (debounced by the table when `debounce` is set), `close()`, and `getValues()` for the distinct single `filterBy` values of all items. `test` gets each item's `filterBy` value as is, arrays and Sets included.

- Only `textFilter` is debounced by default now (300 ms instead of 500 ms for every filter); select, range and date filters apply immediately. `textFilter` and `rangeFilter` take a `debounce` option (ms).
- **Saved filter values carry over.** The storage key and format are unchanged, and every built-in filter keeps its value shape (text: `string`; select: `Set`; range: `[min, max]`; date: `Date` or `DateRange`), so values saved by 0.51 are restored under the same column id. Two cases change behaviour: a column that gets an explicit `id` during the migration loses its saved value (it was stored under the column index), and a select filter whose column gains a `filterBy` that changes the value type (e.g. `Date` → ISO string) restores values that no longer match any item. Needs human review if either applies and the persisted filters matter.
- The per-filter `persist` prop moved to the table's `persist` config: `persist={{ …, exclude: [{ filterValues: ['columnId'] }] }}` replaces `persist={false}` on that column's filter. `include: [{ filterValues: [...] }]` persists only the listed filters.
- New theme text `text.hiddenColumnFilters`: add it to translated themes.
- `AutoFocusTextField` now focuses whenever it mounts, not only inside an open filter popover.
- Type check gap: the check passes when the column type is wider than everything the filter accepts, e.g. a column typed `unknown`.
- `TableState.filters` and the actions `registerFilter`/`syncControlledFilterValue` are gone; `actions.setFilterValues(map)` was added. `TableRef` gained `getFilterValues`/`setFilterValues`.
- **Needs human review:** a filter's `onChange` now also fires for table reset and restored persisted values, not only for UI changes.

## 11. `debugRender` messages changed

`debugRender` now reports `'render table'`, `'render row', id` and `'render cell', columnId`. `'render table inner'` and `'Virtualized render …'` are gone. Update render-count tests that match on these strings.

## 12. Styling: library styles are prepended, function styles are costly

The table's own styles now live in a separate emotion stylesheet (key `<your cache key>-st`, e.g. `css-st`) that is inserted **before** all other styles. Any override of equal specificity now wins, including a plain class from a CSS file passed via `classes`. Previously the built-in styles were appended and beat such classes.

- **Needs human review:** overrides that used extra specificity or `!important` only to beat the built-in styles still work, and can be simplified.
- Row, cell and details styles are inserted on the client only. Server-rendered HTML no longer contains them; they apply on hydration.
- Style objects are cached by identity: don't mutate a style object after passing it; pass a new one.
- Function styles (`styles.row/cell/details` as `(item, index) => …`) run on every row or cell render. Returning new objects makes emotion serialize them each time. Prefer `classes` or return `css\`…\`` results or module-level constants.

## 13. Excel exporter uses `write-excel-file` instead of `xlsx`

`grep -rn "excelExporter\|from 'xlsx'" src/ package.json`

If the project uses `schummar-table/excelExporter`: replace the `xlsx` dependency with `write-excel-file` (`>=4`), unless `xlsx` is used elsewhere. Date cells are formatted as `yyyy-mm-dd` by default; pass `new ExcelExporter({ dateFormat: 'dd.mm.yyyy' })` for another Excel number format.

Custom exporters: `BlobExporter.exportToBlob` may now return a `Promise<Blob>`. Code that calls `exportToBlob` directly must `await` it.

## 14. Sticky header and footer: the row is sticky, not the cells

Grep: `grep -rnE 'headerCell|footerCell|stickyHeader|stickyFooter' src/`

`position: sticky` moved from each header/footer cell to the header/footer row (see section 4). A `top` offset on `styles.headerCell` (or `bottom` on `styles.footerCell`) used to offset the sticky cells; now the cells are positioned relative to an already-sticky row, so the header labels shift down over the first row. There is no type error.

Move the offset to the table prop:

```tsx
// before
<Table styles={{ headerCell: { top: 64 } }} />
// after
<Table stickyHeader={{ top: 64 }} />
```

`stickyHeader.top` and `stickyFooter.bottom` accept a number (px) or a CSS string, e.g. `stickyHeader={{ top: 'var(--app-shell-header-height)' }}`. Check for the same offsets in `TableSettingsProvider` themes and in CSS passed via `classes.headerCell`. A theme can't set the sticky offset anymore: pass `stickyHeader` on each table, or in the app's own `Table` wrapper if it has one.

**Needs human review:** verify in the browser: scroll a table with a sticky header and check the labels stay aligned with the header background.

<!-- Append new dated sections here for future breaking changes, following the same grep / before-after / needs-human-review structure. -->
