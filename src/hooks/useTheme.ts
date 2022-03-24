import { useContext } from 'react';
import { Store } from 'schummar-state/react';
import { TableContext } from '../components/table';
import { defaultTableTheme } from '../theme/defaultTheme';
import { globalTableTheme, mergeThemes, TableThemeContext } from '../theme/tableTheme';
import { MemoizedTableTheme, TableTheme } from '../types';
import { useTableMemo } from './useTableMemo';

const emptyStore = new Store(undefined);

export function useTheme<T, S>(selector: (theme: MemoizedTableTheme<T>) => S): S {
  const contextTableTheme = useContext(TableThemeContext);
  const table = useContext(TableContext);
  const memo = useTableMemo();

  const process = (t: TableTheme<T>): MemoizedTableTheme<T> => {
    const cell = t.classes?.cell;
    const selected = t.text.selected;

    return {
      ...t,
      classes: {
        ...t.classes,
        cell: cell instanceof Function || Array.isArray(cell) ? memo('theme.classes.cell', cell) : cell,
      },
      text: {
        ...t.text,
        selected: selected instanceof Function || Array.isArray(selected) ? memo('theme.text.selected', selected) : selected,
      },
    };
  };

  const theme =
    table?.useState((state) => {
      const localTheme = {
        text: state.props.text,
        classes: state.props.classes,
        components: state.props.components,
        icons: state.props.icons,
        colors: state.props.colors,
        spacing: state.props.spacing,
      };

      const theme = mergeThemes(defaultTableTheme, globalTableTheme, contextTableTheme, localTheme) as TableTheme<T>;

      return selector(process(theme));
    }) ??
    emptyStore.useState() ??
    selector(process(mergeThemes(defaultTableTheme, globalTableTheme, contextTableTheme) as TableTheme<T>));

  return theme;
}
