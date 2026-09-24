import { ClassNames } from '@emotion/react';
import { createContext, useState, type ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { useCssVariables } from '../theme/useCssVariables';

export const FilterControlContext = createContext({
  isActive: false,
  close: (): void => undefined,
});

export function FilterControl<T>(): ReactElement | null {
  const { filters, filterValues, activeColumns, actions } = useTableStructure<T>();
  const columnId = useColumnContext();

  const Popover = useTheme((t) => t.components.Popover);
  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);
  const IconButton = useTheme((t) => t.components.IconButton);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const ArrowDropDown = useTheme((t) => t.icons.ArrowDropDown);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);
  const impl = filters.get(columnId);
  const filterValue = filterValues.get(columnId);
  const isActive = impl !== undefined && filterValue !== undefined && impl.isActive(filterValue);
  const filterClassNames = impl?.classNames;
  const filter = activeColumns.find((column) => column.id === columnId)?.filter;

  function reset() {
    actions.setFilterValue(columnId, undefined);
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
