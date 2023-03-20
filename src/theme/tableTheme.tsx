import type { ReactNode } from 'react';
import { createContext } from 'react';
import { Store } from 'schummar-state/react';
import type { PartialTableTheme } from '../types';

export const globalTableTheme = new Store<PartialTableTheme>({});

export function configureTableTheme(tableTheme: PartialTableTheme) {
  globalTableTheme.set(tableTheme);
}

export const TableThemeContext = createContext<PartialTableTheme>({});

export function TableThemeProvider({
  theme,
  children,
}: {
  theme: PartialTableTheme;
  children?: ReactNode;
}) {
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
