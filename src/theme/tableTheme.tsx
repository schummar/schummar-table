import { createContext, ReactNode, useContext } from 'react';
import { DeepPartial } from '../misc/deepPartial';
import { InternalTableProps, TableTheme } from '../types';
import { defaultTableTheme } from './defaultTheme/defaultTableTheme';

let globalTableTheme: DeepPartial<TableTheme> = {};
export function configureTableTheme(tableTheme: DeepPartial<TableTheme>) {
  globalTableTheme = tableTheme;
}

export const TableThemeContext = createContext<DeepPartial<TableTheme>>({});

export function TableThemeProvider({ theme, children }: { theme: DeepPartial<TableTheme>; children: ReactNode }) {
  return <TableThemeContext.Provider value={theme}>{children}</TableThemeContext.Provider>;
}

export function mergeThemes<T>(...themes: DeepPartial<TableTheme<T>>[]): DeepPartial<TableTheme<T>> {
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
