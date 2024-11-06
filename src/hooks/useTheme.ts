import { useContext } from 'react';
import { Store } from 'schummar-state/react';
import { ColumnContext, TableContext } from '../misc/tableContext';
import { defaultTableTheme } from '../theme/defaultTheme';
import { globalTableTheme, mergeThemes } from '../theme/tableTheme';
import type { MemoizedTableTheme, TableTheme } from '../types';
import { useTableMemo } from './useTableMemo';
import { TableSettingsContext } from '../misc/tableSettings';

const emptyStore = new Store(undefined);

export function useTheme<T, S>(selector: (theme: MemoizedTableTheme<T>) => S): S {
  const { theme: contextTableTheme = {} } = useContext(TableSettingsContext);
  const table = useContext(TableContext);
  const columnId = useContext(ColumnContext);
  const memo = useTableMemo();
  const _globalTableTheme = globalTableTheme.useState();

  const process = (t: TableTheme<T>): MemoizedTableTheme<T> => {
    const cellClass = t.classes?.cell;
    const cellStyles = t.styles?.cell;
    const detailsClass = t.classes?.details;
    const detailsStyles = t.styles?.details;

    return {
      ...t,
      classes: {
        ...t.classes,
        cell:
          cellClass instanceof Function || Array.isArray(cellClass)
            ? memo('theme.classes.cell', cellClass)
            : cellClass,
        details:
          detailsClass instanceof Function || Array.isArray(detailsClass)
            ? memo('theme.classes.details', detailsClass)
            : detailsClass,
      },
      styles: {
        ...t.styles,
        cell:
          cellStyles instanceof Function || Array.isArray(cellStyles)
            ? memo('theme.styles.cell', cellStyles)
            : cellStyles,
        details:
          detailsStyles instanceof Function || Array.isArray(detailsStyles)
            ? memo('theme.styles.details', detailsStyles)
            : detailsStyles,
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
        styles: state.props.styles,
        components: state.props.components,
        icons: state.props.icons,
        colors: state.props.colors,
        spacing: state.props.spacing,
      };

      const column = state.activeColumns.find((column) => column.id === columnId);
      const columnsTheme = {
        classes: column?.classes,
        styles: column?.styles,
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
