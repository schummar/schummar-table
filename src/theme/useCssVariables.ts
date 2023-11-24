import { useTheme } from '../hooks/useTheme';

export function useCssVariables() {
  return useTheme(({ spacing, colors }) => {
    return {
      '--spacing': spacing,
      '--primaryMain': colors.primary.main,
      '--primaryLight': colors.primary.light,
      '--primaryContrastText': colors.primary.contrastText,
      '--secondaryMain': colors.secondary.main,
      '--secondaryLight': colors.secondary.light,
      '--secondaryContrastText': colors.secondary.contrastText,
      '--blockedMain': colors.blocked.main,
      '--blockedLight': colors.blocked.light,
      '--blockedContrastText': colors.blocked.contrastText,
    };
  });
}
