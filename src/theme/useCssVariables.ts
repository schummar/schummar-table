import { useTheme } from '../hooks/useTheme';

export function useCssVariables() {
  const theme = useTheme();

  return {
    '--spacing': theme.spacing,
    '--primaryMain': theme.colors.primary.main,
    '--primaryLight': theme.colors.primary.light,
    '--primaryContrastText': theme.colors.primary.contrastText,
    '--secondaryMain': theme.colors.secondary.main,
    '--secondaryLight': theme.colors.secondary.light,
    '--secondaryContrastText': theme.colors.secondary.contrastText,
  };
}
