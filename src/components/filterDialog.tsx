import { forwardRef, useContext } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { FilterControlContext } from './filterControl';

export default forwardRef(FilterDialog);

function FilterDialog(_props: {}, ref: React.Ref<HTMLDialogElement>): JSX.Element | null {
  const table = useTableContext();
  const columnId = useColumnContext();

  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);
  const IconButton = useTheme((t) => t.components.IconButton);
  const FilterList = useTheme((t) => t.icons.FilterList);

  const filter = table.useState(
    (state) => state.activeColumns.find((column) => column.id === columnId)?.filter,
  );

  const label = table.useState((state) => {
    return state.activeColumns.find((column) => column.id === columnId)?.header ?? null;
  });

  const isActive = table.useState((state) => {
    const filter = state.filters.get(columnId);
    const filterValue = state.filterValues.get(columnId);
    return filter !== undefined && filterValue !== undefined && filter.isActive(filterValue);
  });

  const { close } = useContext(FilterControlContext);

  return (
    <dialog
      ref={ref}
      onClick={close}
      className={classes?.dialog}
      css={[
        {
          padding: 0,
          border: 'none',
          borderRadius: 4,

          '::backdrop': {
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
          },
        },
        styles?.dialog,
      ]}
    >
      <div onClick={(e) => e.stopPropagation()}>
        <div
          css={{
            position: 'relative',
            padding: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <FilterList
            css={{
              color: isActive ? 'var(--primaryMain)' : '#b0bac9',
            }}
          />

          <div
            css={{
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              paddingRight: '2em',
            }}
          >
            {label}
          </div>

          <IconButton
            onClick={close}
            css={{
              position: 'absolute',
              right: 0,
              top: 0,
              fontSize: '1em',
              padding: '0.5em',
              margin: '0.5em',
              lineHeight: 1,
            }}
          >
            ✕
          </IconButton>
        </div>

        <div
          css={{
            overflow: 'auto',
          }}
        >
          {filter}
        </div>
      </div>
    </dialog>
  );
}
