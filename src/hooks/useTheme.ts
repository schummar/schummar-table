import { useContext } from 'react';
import { Store } from 'schummar-state/react';
import { ColumnContext, TableContext } from '../misc/tableContext';
import { defaultTableTheme } from '../theme/defaultTheme';
import { globalTableTheme, mergeThemes, TableThemeContext } from '../theme/tableTheme';
import type { MemoizedTableTheme, TableTheme } from '../types';
import { useTableMemo } from './useTableMemo';

const emptyStore = new Store(undefined);

export function useTheme<T, S>(selector: (theme: MemoizedTableTheme<T>) => S): S {
  const contextTableTheme = useContext(TableThemeContext);
  const table = useContext(TableContext);
  const columnId = useContext(ColumnContext);
  const memo = useTableMemo();
  const _globalTableTheme = globalTableTheme.useState();

  const process = (t: TableTheme<T>): MemoizedTableTheme<T> => {
    const cell = t.classes?.cell;

    return {
      ...t,
      classes: {
        ...t.classes,
        cell:
          cell instanceof Function || Array.isArray(cell) ? memo('theme.classes.cell', cell) : cell,
      },
      text: {
        ...t.text,
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

      const column = state.activeColumns.find((column) => column.id === columnId);
      const columnsTheme = {
        classes: column?.classes,
      };

      const theme = mergeThemes(
        defaultTableTheme,
        _globalTableTheme,
        contextTableTheme,
        localTheme,
        columnsTheme,
      ) as TableTheme<T>;

      return selector(process(theme));
    }) ??
    emptyStore.useState() ??
    selector(
      process(
        mergeThemes(defaultTableTheme, _globalTableTheme, contextTableTheme) as TableTheme<T>,
      ),
    );

  return theme;
}
