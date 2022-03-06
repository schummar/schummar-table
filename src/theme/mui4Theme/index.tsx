import { Badge, Button, Checkbox, CircularProgress, IconButton, TextField, useTheme } from '@material-ui/core';
import { ReactNode, useMemo } from 'react';
import { PartialTableTheme, TableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes, TableThemeContext } from '../tableTheme';

export const mui4Theme: Partial<TableTheme> = {
  components: {
    Button: (props) => (
      <Button
        {...props}
        size="small"
        fullWidth
        css={{ justifyContent: 'start !important' }}
        color={props.variant === 'contained' ? 'primary' : 'inherit'}
      />
    ),
    IconButton: (props) => <IconButton {...props} size="small" color="inherit" />,
    Checkbox: (props) => <Checkbox {...props} color="primary" size="medium" />,
    Popover,
    Badge,
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} size="small" variant="outlined" />,
    Spinner: CircularProgress,
  },
};

export function Mui4TableThemeProvider({ theme, children }: { theme?: PartialTableTheme; children: ReactNode }) {
  const muiTheme = useTheme();

  const _theme = useMemo(() => {
    return mergeThemes(
      {
        colors: {
          primary: muiTheme.palette.primary,
          secondary: muiTheme.palette.secondary,
        },
      },
      mui4Theme,
      theme ?? {},
    );
  }, [muiTheme, theme]);

  return <TableThemeContext.Provider value={_theme}>{children}</TableThemeContext.Provider>;
}
