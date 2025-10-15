import { ClassNames } from '@emotion/react';
import { createContext, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { useCssVariables } from '../theme/useCssVariables';

export const FilterControlContext = createContext({
  isActive: false,
  close: (): void => undefined,
});

export function FilterControl<T>(): JSX.Element | null {
  const table = useTableContext<T>();
  const columnId = useColumnContext();

  const Popover = useTheme((t) => t.components.Popover);
  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);
  const IconButton = useTheme((t) => t.components.IconButton);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const ArrowDropDown = useTheme((t) => t.icons.ArrowDropDown);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);
  const isActive = table.useState((state) => {
    const filter = state.filters.get(columnId);
    const filterValue = state.filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });
  const filterClassNames = table.useState((state) => {
    const filter = state.filters.get(columnId);
    return filter?.classNames;
  });
  const filter = table.useState(
    (state) => state.activeColumns.find((column) => column.id === columnId)?.filter,
  );

  function reset() {
    const impl = table.getState().filters.get(columnId);

    impl?.onChange?.(undefined);

    if (impl?.value === undefined) {
      table.update((state) => {
        state.filterValues.delete(columnId);
      });
    }
  }

  if (!filter) return null;

  function close() {
    setAnchor(null);
  }

  return (
    <FilterControlContext.Provider value={{ isActive: !!anchor, close }}>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        onContextMenu={(event) => {
          reset();
          event.preventDefault();
          return false;
        }}
        css={[
          { color: '#b0bac9' },
          isActive && {
            color: 'var(--primaryMain) !important',
          },
        ]}
      >
        {isActive ? <FilterList /> : <ArrowDropDown />}
      </IconButton>

      <div
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
        }}
      >
        <ClassNames>
          {({ css, cx }) => (
            <Popover
              open
              hidden={!anchor}
              onClose={close}
              anchorEl={anchor ?? document.body}
              css={[cssVariables, styles?.popover]}
              className={cx(classes?.popover, filterClassNames?.popover)}
              backdropClassName={cx(
                classes?.popoverBackdrop,
                filterClassNames?.popoverBackdrop,
                css(styles?.popoverBackdrop),
              )}
            >
              {filter}
            </Popover>
          )}
        </ClassNames>
      </div>
    </FilterControlContext.Provider>
  );
}
