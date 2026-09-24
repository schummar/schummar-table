import { createContext, useContext, useMemo } from 'react';
import { TableSettingsContext } from '../misc/tableSettings';
import { defaultTableTheme } from '../theme/defaultTheme';
import { mergeThemes } from '../theme/tableTheme';
import type { InternalColumn, PartialTableTheme, TableTheme } from '../types';

export const ThemeContext = createContext<TableTheme<any> | null>(null);

/** default < TableSettingsProvider < table props, merged once per change instead of per consumer. */
export function useTableTheme<T>(props: PartialTableTheme<T>): TableTheme<T> {
  const { theme: contextTheme } = useContext(TableSettingsContext);
  const { text, classes, styles, components, icons, colors, spacing } = props;

  return useMemo(
    () =>
      mergeThemes<T>(defaultTableTheme as TableTheme<T>, contextTheme as PartialTableTheme<T>, {
        text,
        classes,
        styles,
        components,
        icons,
        colors,
        spacing,
      }) as TableTheme<T>,
    [contextTheme, text, classes, styles, components, icons, colors, spacing],
  );
}

export function useTheme<T, S>(selector: (theme: TableTheme<T>) => S): S {
  const tableTheme = useContext(ThemeContext);
  const { theme: contextTheme } = useContext(TableSettingsContext);
  const fallback = useMemo(
    () =>
      tableTheme
        ? undefined
        : (mergeThemes(defaultTableTheme, contextTheme) as TableTheme<unknown>),
    [tableTheme, contextTheme],
  );

  return selector((tableTheme ?? fallback) as TableTheme<T>);
}

/** The theme with a column's own classes and styles layered on top. */
export function columnTheme<T>(
  theme: TableTheme<T>,
  column: Pick<InternalColumn<T, unknown>, 'classes' | 'styles'> | undefined,
): TableTheme<T> {
  if (!column?.classes && !column?.styles) return theme;
  return {
    ...theme,
    classes: { ...theme.classes, ...column.classes },
    styles: { ...theme.styles, ...column.styles },
  };
}
