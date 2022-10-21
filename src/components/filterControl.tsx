import { createContext, useMemo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useCssVariables } from '../theme/useCssVariables';
import { useColumnContext, useTableContext } from './table';

export const FilterControlContext = createContext({
  isActive: false,
  close: (): void => void 0,
});

export function FilterControl<T>(): JSX.Element | null {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const IconButton = useTheme((t) => t.components.IconButton);
  const Popover = useTheme((t) => t.components.Popover);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const ArrowDropDown = useTheme((t) => t.icons.ArrowDropDown);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);
  const isActive = table.useState((state) => {
    const filter = state.filters.get(columnId);
    const filterValue = state.filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });
  const filter = table.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.filter);

  function reset() {
    table.update((state) => {
      const impl = state.filters.get(columnId);

      impl?.onChange?.(undefined);

      if (impl?.value !== undefined) {
        state.filterValues.delete(columnId);
      }
    });
  }

  const context = useMemo(
    () => ({
      isActive: !!anchor,
      close: () => setAnchor(null),
    }),
    [!!anchor],
  );

  if (!filter) return null;

  return (
    <FilterControlContext.Provider value={context}>
      <div
        onClick={(e) => setAnchor(e.currentTarget)}
        onContextMenu={(e) => {
          reset();
          e.preventDefault();
          return false;
        }}
      >
        <IconButton
          css={[
            { color: '#b0bac9' },
            isActive && {
              color: 'var(--primaryMain) !important',
            },
          ]}
        >
          {isActive ? <FilterList /> : <ArrowDropDown />}
        </IconButton>
      </div>

      <div
        onPointerDown={(e) => {
          e.stopPropagation();
        }}
        onPointerMove={(e) => {
          e.stopPropagation();
        }}
      >
        <Popover open hidden={!anchor} onClose={() => setAnchor(null)} anchorEl={anchor ?? document.body} css={cssVariables}>
          {filter}
        </Popover>
      </div>
    </FilterControlContext.Provider>
  );
}
