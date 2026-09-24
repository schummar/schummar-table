import { ClassNames } from '@emotion/react';
import { useState, type ReactElement } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { isActiveFilter } from '../state/useFilters';
import { useCssVariables } from '../theme/useCssVariables';
import type { InternalColumn } from '../types';
import { FilterPanel } from './filterPanel';

export function FilterControl<T>(): ReactElement | null {
  const { filterValues, visibleColumns, actions } = useTableStructure<T>();
  const columnId = useColumnContext();
  const column = visibleColumns.find((column) => column.id === columnId);

  const IconButton = useTheme((t) => t.components.IconButton);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const ArrowDropDown = useTheme((t) => t.icons.ArrowDropDown);

  const [anchor, setAnchor] = useState<Element | null>(null);

  if (!column?.filter) return null;

  const isActive = isActiveFilter(column.filter, filterValues.get(columnId));

  return (
    <>
      <IconButton
        onClick={(event) => setAnchor(event.currentTarget)}
        onContextMenu={(event) => {
          actions.setFilterValue(columnId, undefined);
          event.preventDefault();
          return false;
        }}
        css={[{ color: '#b0bac9' }, isActive && { color: 'var(--primaryMain) !important' }]}
      >
        {isActive ? <FilterList /> : <ArrowDropDown />}
      </IconButton>

      {anchor && (
        <FilterPopover anchor={anchor} onClose={() => setAnchor(null)} column={column}>
          <FilterPanel column={column} close={() => setAnchor(null)} />
        </FilterPopover>
      )}
    </>
  );
}

export function FilterPopover<T>({
  anchor,
  onClose,
  column,
  children,
}: {
  anchor: Element;
  onClose: () => void;
  column?: InternalColumn<T, unknown>;
  children: React.ReactNode;
}): ReactElement {
  const Popover = useTheme((t) => t.components.Popover);
  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);
  const cssVariables = useCssVariables();
  const filterClassNames = column?.filter?.classNames;

  return (
    // Keeps pointer events from reaching the header, e.g. the resize handle.
    <div
      onPointerDown={(event) => event.stopPropagation()}
      onPointerMove={(event) => event.stopPropagation()}
    >
      <ClassNames>
        {({ css, cx }) => (
          <Popover
            open
            onClose={onClose}
            anchorEl={anchor}
            css={[cssVariables, styles?.popover]}
            className={cx(classes?.popover, filterClassNames?.popover)}
            backdropClassName={cx(
              classes?.popoverBackdrop,
              filterClassNames?.popoverBackdrop,
              css(styles?.popoverBackdrop),
            )}
          >
            {children}
          </Popover>
        )}
      </ClassNames>
    </div>
  );
}
