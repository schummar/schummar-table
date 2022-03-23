import { useContext } from 'react';
import { Store } from 'schummar-state/react';
import { TableContext } from '../components/table';
import { defaultTableTheme } from '../theme/defaultTheme';
import { globalTableTheme, mergeThemes, TableThemeContext } from '../theme/tableTheme';
import { TableTheme } from '../types';

const emptyStore = new Store(undefined);

export function useTheme<T, S>(selector: (theme: TableTheme<T>) => S): S {
  const contextTableTheme = useContext(TableThemeContext);
  const table = useContext(TableContext);

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
      return selector(theme);
    }) ??
    emptyStore.useState() ??
    selector(mergeThemes(defaultTableTheme, globalTableTheme, contextTableTheme) as TableTheme<T>);

  return theme;
}
