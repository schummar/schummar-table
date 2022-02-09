import { useTableContext } from '..';

export function useCssVariables() {
  const table = useTableContext();
  return table.useState((state) => ({
    '--spacing': state.theme.spacing,
    '--primary': state.theme.colors.primary,
    '--primaryLight': state.theme.colors.primaryLight,
    '--primaryContrastText': state.theme.colors.primaryContrastText,
  }));
}
