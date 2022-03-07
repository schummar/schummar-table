import { useTableContext } from '..';

export function useCssVariables() {
  const table = useTableContext();
  return table.useState((state) => ({
    '--spacing': state.theme.spacing,
    '--primaryMain': state.theme.colors.primary.main,
    '--primaryLight': state.theme.colors.primary.light,
    '--primaryContrastText': state.theme.colors.primary.contrastText,
    '--secondaryMain': state.theme.colors.secondary.main,
    '--secondaryLight': state.theme.colors.secondary.light,
    '--secondaryContrastText': state.theme.colors.secondary.contrastText,
  }));
}
