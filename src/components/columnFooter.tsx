import { columnTheme, useTheme } from '../hooks/useTheme';
import { useColumnContext, useTableStructure } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';

export function ColumnFooter() {
  const columnId = useColumnContext();
  const { activeColumns } = useTableStructure();
  const column = activeColumns.find((column) => column.id === columnId);
  const { classes, styles } = useTheme((theme) => columnTheme(theme, column));

  return (
    <div className={classes?.footerCell} css={[defaultClasses.footerCell, styles?.footerCell]}>
      {column?.footer}
    </div>
  );
}
