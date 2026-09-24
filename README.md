# schummar-table

[![](https://badgen.net/npm/v/schummar-table)](https://www.npmjs.com/package/schummar-table)
[![](https://badgen.net/npm/v/schummar-table/next)](https://www.npmjs.com/package/schummar-table/v/next)
[![](https://badgen.net/bundlephobia/minzip/schummar-table)](https://bundlephobia.com/package/schummar-table)

A fast, fully typed table for React. Sorting, filtering, selection, trees, column resizing,
virtualization, persistence and exports work out of the box. Every piece of state can be left to
the table or controlled from outside.

- **Typed end to end.** Column values flow into `renderCell`, `sortBy` and `filterBy`, and filters
  are type checked against the column they sit on.
- **Fast.** Rows and cells are memoized, virtualization uses
  [TanStack Virtual](https://tanstack.com/virtual), and expensive cells can render progressively.
- **Unopinionated styling.** Plain class names or emotion styles for every part, with built-in
  styles that your overrides always win against. Themes for MUI 4 and 5 are included.

## Installation

```bash
npm install schummar-table @emotion/react
```

React 19 or newer is required. `xlsx` is only needed for the Excel exporter, `@mui/material` or
`@material-ui/core` only for the matching theme.

## Quick start

```tsx
import { Table, selectFilter, textFilter } from 'schummar-table';

interface Person {
  id: number;
  name: string;
  job: string;
  birthday: Date;
}

export function People({ people }: { people: Person[] }) {
  return (
    <Table
      items={people}
      id="id"
      columns={(col) => [
        col((person) => person.name, { header: 'Name', filter: textFilter() }),
        col((person) => person.job, { header: 'Job', filter: selectFilter() }),
        col((person) => person.birthday, {
          header: 'Birthday',
          renderCell: (birthday) => birthday.toLocaleDateString(),
        }),
      ]}
    />
  );
}
```

`col(value, options)` infers the column value from its first argument, so `birthday` above is a
`Date` everywhere.

## Columns

```tsx
col((person) => person.birthday, {
  id: 'birthday', // stable id for persistence and controlled state; defaults to the index
  header: 'Birthday',
  renderCell: (birthday, person) => birthday.toLocaleDateString(),
  sortBy: [(birthday) => birthday.getTime()],
  exportCell: (birthday) => birthday.toISOString(),
  width: '12ch', // any CSS grid width; defaults to max-content
  displaySize: 'desktop', // only show on some screen sizes
});
```

Columns can be hidden by the user (`enableColumnSelection`, on by default) and resized by dragging
the header separators (`enableColumnResize`).

## Filters

A filter is created with a factory and put on a column. Its UI opens from the column header.

```tsx
col((person) => person.name, { filter: textFilter({ compare: 'prefix' }) });
col((person) => person.tags, { filter: selectFilter() }); // string[] works too
col((person) => person.age, { filter: rangeFilter({ min: 0 }) });
col((person) => person.birthday, { filter: dateFilter({ maxDate: new Date() }) });
```

| Filter         | Accepts                                      |
| -------------- | -------------------------------------------- |
| `textFilter`   | `string`, `number`, `bigint`                 |
| `selectFilter` | anything; `options`, `render` etc. narrow it |
| `rangeFilter`  | `number`, `bigint`                           |
| `dateFilter`   | `Date`, `DateRange`, ISO date strings        |

Each also accepts `null`/`undefined`, arrays and Sets (an item matches if one of the values
does). A filter that doesn't fit the column value is a type error. Use `filterBy` to filter by
something else:

```tsx
col((person) => person.birthday, {
  filterBy: (birthday) => birthday.getFullYear(),
  filter: rangeFilter(),
});
```

Every filter takes `defaultValue`, `value` and `onChange` (typed by the filter's own value), and
`external` to leave the actual filtering to you, e.g. on the server. All filter values can also be
controlled at once with `filterValues` / `onFilterValuesChange` on the table.

Custom filters are made with `defineFilter`:

```tsx
const flagFilter = defineFilter<boolean, boolean>({
  isActive: (value) => value,
  test: (value, input) => input === value,
  Component: ({ value, onChange }) => (
    <label>
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      Only flagged
    </label>
  ),
});
```

## State

The table manages its state on its own. Every part can be initialized or controlled instead, the
same way as React inputs:

| State          | Initial                | Controlled      | Change                  |
| -------------- | ---------------------- | --------------- | ----------------------- |
| Sort           | `defaultSort`          | `sort`          | `onSortChange`          |
| Selection      | `defaultSelection`     | `selection`     | `onSelectionChange`     |
| Expanded rows  | `defaultExpanded`      | `expanded`      | `onExpandedChange`      |
| Hidden columns | `defaultHiddenColumns` | `hiddenColumns` | `onHiddenColumnsChange` |
| Filter values  | `defaultFilterValues`  | `filterValues`  | `onFilterValuesChange`  |

Use `externalSort` when the items arrive sorted already. A `ref` gives imperative access, and
`useTableActions()` / `useTableContext()` do the same from components inside the table.

## Trees and row details

```tsx
<Table items={items} id="id" parentId="parentId" columns={columns} />
```

Items with a `parentId` become collapsible children of their parent. `hasDeferredChildren` marks
items whose children load on expand, and `revealFiltered` expands parents of matching children.
`rowDetails` renders an expandable area below each row instead.

## Large tables

```tsx
<Table virtual items={items} ... />
<Table virtual={{ rowHeight: 40, overscan: 10, deferCells: true }} items={items} ... />
```

`virtual` only renders the rows in view. It works inside any scroll container or with the window.
`deferCells` renders expensive cells progressively: rows that don't fit the frame budget show a
placeholder first, and visible rows are revealed first. Use `deferred` on single columns instead.

## Persistence

```tsx
<Table persist={{ storage: localStorage, id: 'people' }} ... />
```

Sort, selection, expanded rows, hidden columns, column widths and filter values are saved and
restored. `include` and `exclude` narrow this down, including single filters with
`{ filterValues: ['name'] }`. Any storage with `getItem`/`setItem`/`removeItem` works, including
async ones like localForage.

## Export

`enableExport` adds copy and download buttons for the visible (or selected) rows as CSV. More
exporters are registered through a provider:

```tsx
import ExcelExporter from 'schummar-table/excelExporter';

<TableSettingsProvider
  additionalExporters={[{ action: 'download', exporter: new ExcelExporter() }]}
>
  <App />
</TableSettingsProvider>;
```

## Styling and themes

Every part accepts class names and emotion styles, per table or per column:

```tsx
<Table
  classes={{ table: 'people', headerCell: 'people-header', evenCell: 'even' }}
  styles={{ cell: { padding: '0.5em 1em' } }}
  ...
/>
```

The built-in styles are inserted before all other styles, so an override of equal specificity
always wins. `classes.row/cell` and `styles.row/cell` also take a function of the item. Prefer
class names or constant styles there: function styles run for every cell render.

Components, icons, texts and colors are replaced through a theme, per table or for all tables via
`TableSettingsProvider`. MUI themes ship as separate entry points:

```tsx
import { Mui5TableThemeProvider } from 'schummar-table/mui5Theme';

<Mui5TableThemeProvider>
  <App />
</Mui5TableThemeProvider>;
```

## Upgrading from 0.x

1.0 changes the filter API, the `virtual` options and a few others. The package ships an agent
skill that walks through the migration: point your coding agent at
`node_modules/schummar-table/skills/schummar-table-upgrade/SKILL.md`.

## License

ISC
