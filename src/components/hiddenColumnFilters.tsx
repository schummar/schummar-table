import { useState, type ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableStructure } from '../state/context';
import { isActiveFilter } from '../state/useFilters';
import type { Id } from '../types';
import { FilterPanel } from './filterPanel';
import { FilterPopover } from './filterControl';

/** Lets users edit the filters of columns that are not visible, see `enableHiddenColumnFilters`. */
export function HiddenColumnFilters<T>(): ReactElement | null {
  const { props, visibleColumns, filterValues, actions } = useTableStructure<T>();
  const IconButton = useTheme((t) => t.components.IconButton);
  const Button = useTheme((t) => t.components.Button);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const title = useTheme((t) => t.text.hiddenColumnFilters);

  const [anchor, setAnchor] = useState<Element | null>(null);
  const [selected, setSelected] = useState<Id>();

  const columns = props.columns.filter(
    (column) => column.filter && !visibleColumns.some((visible) => visible.id === column.id),
  );
  if (columns.length === 0) return null;

  const isActive = (columnId: Id) =>
    isActiveFilter(
      columns.find((column) => column.id === columnId)?.filter,
      filterValues.get(columnId),
    );
  const anyActive = columns.some((column) => isActive(column.id));
  const selectedColumn = columns.find((column) => column.id === selected);

  function close() {
    setAnchor(null);
    setSelected(undefined);
  }

  const color = (active: boolean) => (active ? 'var(--primaryMain)' : '#b0bac9');

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        css={{ color: color(anyActive) }}
      >
        <FilterList />
      </IconButton>

      {anchor && (
        <FilterPopover anchor={anchor} onClose={close} column={selectedColumn}>
          {selectedColumn ? (
            <div css={{ display: 'grid' }}>
              <Button
                onClick={() => setSelected(undefined)}
                css={{ justifyContent: 'flex-start', color: 'inherit' }}
              >
                ‹ {selectedColumn.header}
              </Button>
              <FilterPanel key={selectedColumn.id} column={selectedColumn} close={close} />
            </div>
          ) : (
            <div
              css={{ padding: 'calc(var(--spacing) * 2)', display: 'grid', gap: 'var(--spacing)' }}
            >
              <div>{title}</div>
              {columns.map((column) => (
                <Button
                  key={column.id}
                  onClick={() => setSelected(column.id)}
                  onContextMenu={(event) => {
                    actions.setFilterValue(column.id, undefined);
                    event.preventDefault();
                  }}
                  startIcon={<FilterList css={{ color: color(isActive(column.id)) }} />}
                  css={{
                    justifyContent: 'flex-start',
                    color: isActive(column.id) ? 'var(--primaryMain)' : 'inherit',
                  }}
                >
                  {column.header}
                </Button>
              ))}
            </div>
          )}
        </FilterPopover>
      )}
    </>
  );
}
