import { useContext, useEffect, useRef, type ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { FilterControlContext } from './filterControl';
import FilterDialog from './filterDialog';

export function NestedFilterControl<T>(): ReactElement | null {
  const { filters, filterValues, activeColumns, actions } = useTableStructure<T>();
  const columnId = useColumnContext();
  const Button = useTheme((t) => t.components.Button);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const dialog = useRef<HTMLDialogElement>(null);
  const parentContext = useContext(FilterControlContext);

  const column = activeColumns.find((column) => column.id === columnId);
  const label = column?.header ?? null;
  const filter = column?.filter;

  const impl = filters.get(columnId);
  const filterValue = filterValues.get(columnId);
  const isActive = impl !== undefined && filterValue !== undefined && impl.isActive(filterValue);

  useEffect(
    () => () => {
      dialog.current?.close();
    },
    [],
  );

  if (!filter) return null;

  function reset() {
    actions.setFilterValue(columnId, undefined);
  }

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
