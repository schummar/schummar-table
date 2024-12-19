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
      '--table-background-color': colors.background,
      '--table-text-color': colors.text,
      '--table-border-color': colors.border,
      '--table-border-light-color': colors.borderLight,
    };
  });
}
