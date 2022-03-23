import { useTheme } from '../hooks/useTheme';

export function useCssVariables() {
  const spacing = useTheme((t) => t.spacing);
  const colors = useTheme((t) => t.colors);

  return {
    '--spacing': spacing,
    '--primaryMain': colors.primary.main,
    '--primaryLight': colors.primary.light,
    '--primaryContrastText': colors.primary.contrastText,
    '--secondaryMain': colors.secondary.main,
    '--secondaryLight': colors.secondary.light,
    '--secondaryContrastText': colors.secondary.contrastText,
  };
}
