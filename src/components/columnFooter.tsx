import { useTheme } from '../hooks/useTheme';
import { cx } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';

export function ColumnFooter() {
  const table = useTableContext();
  const columnId = useColumnContext();
  const stickyFooter = table.useState((state) => state.props.stickyFooter);
  const columnStyleOverride = table.useState((state) => state.columnStyleOverride.get(columnId), {
    throttle: 16,
  });
  const columnClasses = table.useState(
    (state) => state.activeColumns.find((column) => column.id === columnId)?.classes?.footerCell,
  );
  const classes = useTheme((theme) => theme.classes?.footerCell);
  const columnCss = table.useState(
    (state) => state.activeColumns.find((column) => column.id === columnId)?.css?.footerCell,
  );
  const css = useTheme((theme) => theme.css?.footerCell);

  const content = table.useState((state) => {
    const column = state.activeColumns.find((column) => column.id === columnId);

    return column?.footer;
  });

  return (
    <div
      className={cx(classes, columnClasses)}
      css={[
        defaultClasses.footerCell,
        css,
        columnCss,
        stickyFooter && defaultClasses.stickyBottom,
        stickyFooter instanceof Object && stickyFooter,
      ]}
      style={columnStyleOverride}
    >
      {content}
    </div>
  );
}
