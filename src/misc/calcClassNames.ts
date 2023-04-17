import type { MemoizedTableTheme } from '../types';

export function calcClassNames<T>(
  classes: MemoizedTableTheme<any>['classes'] | undefined,
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
  css: MemoizedTableTheme<any>['css'] | undefined,
  item: T,
  index: number,
) {
  return [
    css?.cell instanceof Function ? css.cell(item, index) : css?.cell,
    index % 2 === 0 && css?.evenCell,
    index % 2 === 1 && css?.oddCell,
  ];
}
