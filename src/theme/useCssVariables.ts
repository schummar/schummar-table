import { useTableContext } from '..';

export function useCssVariables() {
  const state = useTableContext();
  return state.useState((state) => ({
    '--spacing': state.theme.spacing,
    '--primary': state.theme.colors.primary,
    '--primaryLight': state.theme.colors.primaryLight,
    '--primaryContrastText': state.theme.colors.primaryContrastText,
  }));
}
