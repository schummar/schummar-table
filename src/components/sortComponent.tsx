import type { ReactNode } from 'react';
import type React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableContext } from '../misc/tableContext';

export function SortComponent<T>({ children }: { children: ReactNode }): JSX.Element {
  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const Badge = useTheme((t) => t.components.Badge);
  const ArrowUpward = useTheme((t) => t.icons.ArrowUpward);

  const { direction, index, sortDisabled } = table.useState((state) => {
    const index = state.sort.findIndex((s) => s.columnId === columnId) ?? -1;
    const column = state.activeColumns.find((column) => column.id === columnId);

    return {
      direction: state.sort[index]?.direction,
      index: index >= 0 && state.sort.length > 1 ? index + 1 : undefined,
      sortDisabled: column?.disableSort ?? state.props.disableSort,
    };
  });

  function toggle(event: React.MouseEvent, off?: boolean) {
    if (sortDisabled) {
      return;
    }

    const {
      props: { sort: controlledSort, onSortChange },
    } = table.getState();

    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    const newSort =
      event.getModifierState('Control') || off
        ? table.getState().sort.filter((s) => s.columnId !== columnId)
        : [];
    if (!off) {
      newSort.push({
        columnId,
        direction: newDirection,
      });
    }

    onSortChange?.(newSort);

    if (!controlledSort) {
      table.update((state) => {
        state.sort = newSort;
      });
    }

    event.preventDefault();
    return false;
  }

  return (
    <div
      css={{
        userSelect: 'none',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) max-content',
        alignItems: 'center',
        cursor: 'pointer',

        '& > div': {
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        },
      }}
      onClick={(event) => toggle(event)}
      onContextMenu={(event) => toggle(event, true)}
    >
      <div>{children}</div>

      {
        <Badge badgeContent={sortDisabled ? 0 : index}>
          <span
            css={[
              { transition: 'all 300ms', fontSize: '0.8em' },
              !direction && { opacity: 0 },
              direction === 'desc' && { transform: 'rotate3d(0, 0, 1, 180deg)' },
            ]}
          >
            <ArrowUpward />
          </span>
        </Badge>
      }
    </div>
  );
}
