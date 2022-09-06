import { useTheme } from '../hooks/useTheme';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useColumnContext, useTableContext } from './table';

export function ColumnFooter() {
  const table = useTableContext();
  const columnId = useColumnContext();
  const stickyFooter = table.useState('props.stickyFooter');
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), { throttle: 16 });
  const columnClasses = table.useState((state) => state.activeColumns.find((column) => column.id === columnId)?.classes);
  const classes = useTheme((theme) => theme.classes);

  const content = table.useState((state) => {
    const column = state.activeColumns.find((column) => column.id === columnId);

    return column?.footer;
  });

  return (
    <div
      className={cx(classes?.footerCell, columnClasses?.footerCell)}
      css={[
        defaultClasses.footerCell,
        columnStyleOverride,
        stickyFooter && defaultClasses.stickyBottom,
        stickyFooter instanceof Object && stickyFooter,
      ]}
    >
      {content}
    </div>
  );
}
