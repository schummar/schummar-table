import { createContext, useContext } from 'react';
import { DeepPartial } from '../misc/deepPartial';
import { InternalTableProps, TableTheme } from '../types';
import { defaultComponents } from './defaultComponents';
import { defaultIcons } from './defaultIcons';
import { defaultTexts } from './defaultTexts';

const defaultTableTheme: TableTheme = {
  text: defaultTexts,
  components: defaultComponents,
  icons: defaultIcons,
  primaryColor: 'green',
  spacing: '5px',
};

let globalTableTheme: DeepPartial<TableTheme> = {};
export function configureTableTheme(tableTheme: DeepPartial<TableTheme>) {
  globalTableTheme = tableTheme;
}

export const TableThemeContext = createContext<DeepPartial<TableTheme>>({});

export function useTableTheme<T>(props: InternalTableProps<T>): TableTheme<T> {
  const contextTableTheme = useContext(TableThemeContext);
  const themes = [defaultTableTheme, globalTableTheme, contextTableTheme] as const;

  return {
    ...Object.assign({}, ...themes),
    text: Object.assign({}, ...[...themes, props].map((theme) => theme.text)),
    css: Object.assign({}, ...[...themes, props].map((theme) => theme.css)),
    components: Object.assign({}, ...[...themes, props].map((theme) => theme.components)),
  };
}
