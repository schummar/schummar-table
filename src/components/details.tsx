import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import type { RowConfig } from './row';

export function Details<T>({
  value,
  rowIndex,
  config,
}: {
  value: T;
  rowIndex: number;
  config: RowConfig<T>;
}) {
  const { rowDetails, theme } = config;
  const details = rowDetails instanceof Function ? rowDetails(value, rowIndex) : rowDetails;
  if (!details) return null;

  const { classes, styles } = theme;
  const className =
    classes?.details instanceof Function ? classes.details(value, rowIndex) : classes?.details;
  const css =
    styles?.details instanceof Function ? styles.details(value, rowIndex) : styles?.details;

  return (
    <div className={className} css={[defaultClasses.details, css]}>
      {details}
    </div>
  );
}
