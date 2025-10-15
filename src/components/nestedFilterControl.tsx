import { useContext, useEffect, useRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { FilterControlContext } from './filterControl';
import FilterDialog from './filterDialog';

export function NestedFilterControl<T>(): JSX.Element | null {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const Button = useTheme((t) => t.components.Button);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const dialog = useRef<HTMLDialogElement>(null);
  const label = table.useState((state) => {
    return state.activeColumns.find((column) => column.id === columnId)?.header ?? null;
  });

  const isActive = table.useState((state) => {
    const filter = state.filters.get(columnId);
    const filterValue = state.filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });

  const filter = table.useState(
    (state) => state.activeColumns.find((column) => column.id === columnId)?.filter,
  );

  useEffect(
    () => () => {
      dialog.current?.close();
    },
    [],
  );

  if (!filter) return null;

  function reset() {
    const impl = table.getState().filters.get(columnId);

    impl?.onChange?.(undefined);

    if (impl?.value === undefined) {
      table.update((state) => {
        state.filterValues.delete(columnId);
      });
    }
  }

  const parentContext = useContext(FilterControlContext);

  function close() {
    dialog.current?.close();
    parentContext.close();
  }

  return (
    <FilterControlContext.Provider value={{ isActive: true, close }}>
      <Button
        onClick={() => dialog.current?.showModal()}
        onContextMenu={(event) => {
          reset();
          event.preventDefault();
          return false;
        }}
        startIcon={
          <FilterList
            css={{
              color: isActive ? 'var(--primaryMain)' : '#b0bac9',
            }}
          />
        }
        css={{
          width: '100%',
          color: isActive ? 'var(--primaryMain)' : 'var(--color-text)',
        }}
      >
        {label}
      </Button>

      <div
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
        }}
      >
        <FilterDialog ref={dialog} />
      </div>
    </FilterControlContext.Provider>
  );
}
