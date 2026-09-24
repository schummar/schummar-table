import { css, type Interpolation } from '@emotion/react';
import { useMemo } from 'react';
import { columnTheme } from '../hooks/useTheme';
import { cx } from '../misc/helpers';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useLibraryClassName, useUserClassName } from '../theme/emotion';
import type { Id, InternalColumn, TableTheme } from '../types';

type ClassOf<T> = (value: T, index: number) => string;

/** Class names for everything a row renders, resolved once per theme and column change. */
export interface RowStyles<T> {
  row: ClassOf<T>;
  fillCell: ClassOf<T>;
  firstCell: ClassOf<T>;
  cells: Map<Id, ClassOf<T>>;
  details: ClassOf<T>;
  text: string;
}

const rowCss = css({ gridColumn: '1 / -1', display: 'grid', gridTemplateColumns: 'subgrid' });

export function useRowStyles<T>(
  theme: TableTheme<T>,
  columns: InternalColumn<T, unknown>[],
): RowStyles<T> {
  const libraryClass = useLibraryClassName();
  const userClass = useUserClassName();

  return useMemo(() => {
    // Static parts are resolved here; only function classes and styles run per row or cell.
    const cellClassOf = ({ classes, styles }: TableTheme<T>, baseClass: string): ClassOf<T> => {
      const { cell: cellClass, evenCell, oddCell } = classes ?? {};
      const { cell: cellStyle, evenCell: evenStyle, oddCell: oddStyle } = styles ?? {};

      if (!(cellClass instanceof Function) && !(cellStyle instanceof Function)) {
        const even = cx(baseClass, cellClass, evenCell, userClass(cellStyle, evenStyle));
        const odd = cx(baseClass, cellClass, oddCell, userClass(cellStyle, oddStyle));
        return (_value, index) => (index % 2 === 0 ? even : odd);
      }

      return (value, index) => {
        const isEven = index % 2 === 0;
        return cx(
          baseClass,
          cellClass instanceof Function ? cellClass(value, index) : cellClass,
          isEven ? evenCell : oddCell,
          userClass(
            cellStyle instanceof Function ? cellStyle(value, index) : cellStyle,
            isEven ? evenStyle : oddStyle,
          ),
        );
      };
    };

    const elementClassOf = (
      baseClass: string,
      className: string | ((value: T, index: number) => string | undefined) | undefined,
      style: Interpolation<any> | ((value: T, index: number) => Interpolation<any>),
    ): ClassOf<T> => {
      if (!(className instanceof Function) && !(style instanceof Function)) {
        const result = cx(baseClass, className, userClass(style));
        return () => result;
      }
      return (value, index) =>
        cx(
          baseClass,
          className instanceof Function ? className(value, index) : className,
          userClass(style instanceof Function ? style(value, index) : style),
        );
    };

    const cellBase = libraryClass(defaultClasses.cell);

    return {
      row: elementClassOf(libraryClass(rowCss), theme.classes?.row, theme.styles?.row),
      fillCell: cellClassOf(theme, libraryClass(defaultClasses.cellFill)),
      firstCell: cellClassOf(theme, libraryClass(defaultClasses.cell, defaultClasses.firstCell)),
      cells: new Map(
        columns.map((column) => [column.id, cellClassOf(columnTheme(theme, column), cellBase)]),
      ),
      details: elementClassOf(
        libraryClass(defaultClasses.details),
        theme.classes?.details,
        theme.styles?.details,
      ),
      text: libraryClass(defaultClasses.text),
    };
  }, [libraryClass, userClass, theme, columns]);
}
