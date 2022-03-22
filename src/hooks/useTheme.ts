import { useContext } from 'react';
import { Store } from 'schummar-state/react';
import { TableContext } from '../components/table';
import { defaultTableTheme } from '../theme/defaultTheme';
import { globalTableTheme, mergeThemes, TableThemeContext } from '../theme/tableTheme';
import { TableTheme } from '../types';

const emptyStore = new Store(undefined);

export function useTheme<T>() {
  const table = useContext(TableContext);
  const localTheme =
    table?.useState((state) => ({
      text: state.props.text,
      classes: state.props.classes,
      components: state.props.components,
      icons: state.props.icons,
      colors: state.props.colors,
      spacing: state.props.spacing,
    })) ??
    emptyStore.useState() ??
    {};

  const contextTableTheme = useContext(TableThemeContext);

  return mergeThemes<T>(defaultTableTheme, globalTableTheme, contextTableTheme, localTheme) as TableTheme<T>;
}
