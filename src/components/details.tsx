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
  const { rowDetails, styles } = config;
  const details = rowDetails instanceof Function ? rowDetails(value, rowIndex) : rowDetails;
  if (!details) return null;

  return <div className={styles.details(value, rowIndex)}>{details}</div>;
}
