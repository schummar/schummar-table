import { Badge, Button, Checkbox, CircularProgress, IconButton, TextField, useTheme } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { PartialTableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes, TableThemeContext } from '../tableTheme';

export const mui5Theme: PartialTableTheme = {
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
    IconButton: (props) => <IconButton {...props} size="small" css={{ fontSize: '0.8em' }} color="inherit" />,
    Checkbox: (props) => <Checkbox {...props} color="primary" size="small" />,
    Popover,
    Badge,
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} size="small" />,
    Spinner: (props) => <CircularProgress {...props} size={20} />,
  },
};

export function Mui5TableThemeProvider({ theme, children }: { theme?: PartialTableTheme; children: ReactNode }) {
  const muiTheme = useTheme();

  const _theme = useMemo(() => {
    return mergeThemes(
      {
        colors: {
          primary: muiTheme.palette.primary,
          secondary: muiTheme.palette.secondary,
        },
      },
      mui5Theme,
      theme ?? {},
    );
  }, [muiTheme, theme]);

  return <TableThemeContext.Provider value={_theme}>{children}</TableThemeContext.Provider>;
}
