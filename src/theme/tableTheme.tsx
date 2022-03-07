import { createContext, ReactNode, useContext } from 'react';
import { InternalTableProps, PartialTableTheme, TableTheme } from '../types';
import { defaultTableTheme } from './defaultTheme/defaultTableTheme';

let globalTableTheme: PartialTableTheme = {};
export function configureTableTheme(tableTheme: PartialTableTheme) {
  globalTableTheme = tableTheme;
}

export const TableThemeContext = createContext<PartialTableTheme>({});

export function TableThemeProvider({ theme, children }: { theme: PartialTableTheme; children: ReactNode }) {
  return <TableThemeContext.Provider value={theme}>{children}</TableThemeContext.Provider>;
}

export function mergeThemes<T>(...themes: PartialTableTheme<T>[]): PartialTableTheme<T> {
  return {
    text: Object.assign({}, ...themes.map((theme) => theme.text)),
    classes: Object.assign({}, ...themes.map((theme) => theme.classes)),
    components: Object.assign({}, ...themes.map((theme) => theme.components)),
    icons: Object.assign({}, ...themes.map((theme) => theme.icons)),
    colors: {
      primary: Object.assign({}, ...themes.map((theme) => theme.colors?.primary)),
      secondary: Object.assign({}, ...themes.map((theme) => theme.colors?.secondary)),
    },
    spacing: themes
      .map((theme) => theme.spacing)
      .reverse()
      .find((x) => x !== undefined),
  };
}

export function useTableTheme<T>(props: InternalTableProps<T>): TableTheme<T> {
  const contextTableTheme = useContext(TableThemeContext);

  return mergeThemes(defaultTableTheme, globalTableTheme, contextTableTheme, props) as TableTheme<T>;
}
