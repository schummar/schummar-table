import type { MemoizedTableTheme } from '../types';

export function calcClassNames<T>(
  classes: MemoizedTableTheme<T>['classes'] | undefined,
  item: T,
  index: number,
) {
  return [
    classes?.cell instanceof Function ? classes.cell(item, index) : classes?.cell,
    index % 2 === 0 && classes?.evenCell,
    index % 2 === 1 && classes?.oddCell,
  ];
}

export function calcCss<T>(
  styles: MemoizedTableTheme<T>['styles'] | undefined,
  item: T | undefined,
  index: number,
) {
  return [
    styles?.cell instanceof Function
      ? item !== undefined
        ? styles.cell(item, index)
        : undefined
      : styles?.cell,
    index % 2 === 0 && styles?.evenCell,
    index % 2 === 1 && styles?.oddCell,
  ];
}
