import { useTableContext } from '..';

export function useCssVariables() {
  const state = useTableContext();
  return state.useState((state) => ({
    '--spacing': state.theme.spacing,
    '--primaryColor': state.theme.primaryColor,
  }));
}
