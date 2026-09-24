import type { ReactElement, ReactNode } from 'react';
import type React from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';

export function SortComponent<T>({ children }: { children: ReactNode }): ReactElement {
  const { sort, activeColumns, props, actions } = useTableStructure<T>();
  const columnId = useColumnContext();
  const Badge = useTheme((t) => t.components.Badge);
  const ArrowUpward = useTheme((t) => t.icons.ArrowUpward);

  const sortIndex = sort.findIndex((s) => s.columnId === columnId);
  const direction = sort[sortIndex]?.direction;
  const index = sortIndex >= 0 && sort.length > 1 ? sortIndex + 1 : undefined;
  const sortDisabled =
    activeColumns.find((column) => column.id === columnId)?.disableSort ?? props.disableSort;

  function toggle(event: React.MouseEvent, off?: boolean) {
    if (sortDisabled) {
      return;
    }

    const newDirection = direction === 'asc' ? 'desc' : 'asc';
    const newSort =
      event.getModifierState('Control') || off ? sort.filter((s) => s.columnId !== columnId) : [];
    if (!off) {
      newSort.push({
        columnId,
        direction: newDirection,
      });
    }

    actions.setSort(newSort);

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
