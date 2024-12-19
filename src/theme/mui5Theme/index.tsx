import {
  Badge,
  Button,
  Checkbox,
  CircularProgress,
  IconButton,
  TextField,
  useTheme,
} from '@mui/material';
import type { ReactNode } from 'react';
import { useMemo } from 'react';
import { TableSettingsProvider } from '../../misc/tableSettings';
import type { PartialTableTheme } from '../../types';
import { Popover } from '../defaultTheme/popover';
import { mergeThemes } from '../tableTheme';

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
    IconButton: (props) => (
      <IconButton {...props} size="small" css={{ fontSize: '0.8em' }} color="inherit" />
    ),
    Checkbox: (props) => <Checkbox {...props} color="primary" size="small" />,
    Popover,
    Badge,
    TextField: ({ startIcon, endIcon, ...props }) => (
      <TextField
        {...props}
        InputProps={{ startAdornment: startIcon, endAdornment: endIcon }}
        size="small"
      />
    ),
    Spinner: (props) => <CircularProgress {...props} size={20} />,
  },
};

export function Mui5TableThemeProvider({
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
      mui5Theme,
      theme ?? {},
    );
  }, [muiTheme, theme]);

  return <TableSettingsProvider theme={_theme}>{children}</TableSettingsProvider>;
}
