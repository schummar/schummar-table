import {
  Badge,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  TextField,
  useTheme,
} from '@material-ui/core';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { TableSettingsProvider } from '../../misc/tableSettings';
import type { PartialTableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes } from '../tableTheme';

export const mui4Theme: PartialTableTheme = {
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
    TextField: ({ startIcon, endIcon, ...props }) => (
      <TextField
        {...props}
        InputProps={{ startAdornment: startIcon, endAdornment: endIcon }}
        size="small"
        variant="outlined"
      />
    ),
    Spinner: CircularProgress,
  },
};

export function Mui4TableThemeProvider({
  theme,
  children,
}: {
  theme?: PartialTableTheme;
  children: ReactNode;
}) {
  const muiTheme = useTheme();

  const _theme = useMemo(() => {
    return mergeThemes(
      {
        colors: {
          primary: muiTheme.palette.primary,
          secondary: muiTheme.palette.secondary,
          background: muiTheme.palette.background.default,
          text: muiTheme.palette.text.primary,
          border: muiTheme.palette.divider,
          borderLight: muiTheme.palette.divider,
        },
      },
      mui4Theme,
      theme ?? {},
    );
  }, [muiTheme, theme]);

  return <TableSettingsProvider theme={_theme}>{children}</TableSettingsProvider>;
}
