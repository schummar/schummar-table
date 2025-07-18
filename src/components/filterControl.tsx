import { createContext, useMemo, useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import { cx } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { useCssVariables } from '../theme/useCssVariables';

export interface FilterControlButtonProps {
  onClick?: (event: React.MouseEvent<Element>) => void;
  onContextMenu?: (event: React.MouseEvent<Element>) => void;
  isActive?: boolean;
}

export interface FilterControlProps {
  component?: React.ElementType<FilterControlButtonProps>;
  onClose?: () => void;
}

export const FilterControlContext = createContext({
  isActive: false,
  close: (): void => undefined,
});

export function FilterControl<T>({
  component: Component = DefaultButton,
  onClose,
}: FilterControlProps): JSX.Element | null {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const Popover = useTheme((t) => t.components.Popover);
  const classes = useTheme((t) => t.classes);
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

  const context = useMemo(
    () => ({
      isActive: !!anchor,
      close: () => setAnchor(null),
    }),
    [anchor],
  );

  if (!filter) return null;

  return (
    <FilterControlContext.Provider value={context}>
      <Component
        onClick={(event) => setAnchor(event.currentTarget)}
        onContextMenu={(event) => {
          reset();
          event.preventDefault();
          return false;
        }}
        isActive={isActive}
      />

      <div
        onPointerDown={(event) => {
          event.stopPropagation();
        }}
        onPointerMove={(event) => {
          event.stopPropagation();
        }}
      >
        <Popover
          open
          hidden={!anchor}
          onClose={() => {
            setAnchor(null);
            onClose?.();
          }}
          anchorEl={anchor ?? document.body}
          css={cssVariables}
          className={cx(classes?.popover, filterClassNames?.popover)}
          backdropClassName={cx(classes?.popoverBackdrop, filterClassNames?.popoverBackdrop)}
        >
          {filter}
        </Popover>
      </div>
    </FilterControlContext.Provider>
  );
}

function DefaultButton({ isActive, ...props }: FilterControlButtonProps) {
  const IconButton = useTheme((t) => t.components.IconButton);
  const FilterList = useTheme((t) => t.icons.FilterList);
  const ArrowDropDown = useTheme((t) => t.icons.ArrowDropDown);

  return (
    <IconButton
      {...props}
      css={[
        { color: '#b0bac9' },
        isActive && {
          color: 'var(--primaryMain) !important',
        },
      ]}
    >
      {isActive ? <FilterList /> : <ArrowDropDown />}
    </IconButton>
  );
}
