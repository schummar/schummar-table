import { Badge, Button, Checkbox, CircularProgress, IconButton, Popover, TextField, useTheme } from '@material-ui/core';
import { ArrowDropDown, ArrowUpward, AssignmentReturn, ChevronRight, Clear, FilterList, GetApp, Search, Tune } from '@material-ui/icons';
import { ReactNode, useMemo } from 'react';
import { DeepPartial } from '../../misc/deepPartial';
import { TableTheme } from '../../types';
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
    Popover: ({ align, ...props }) => (
      <Popover
        {...props}
        open={props.open}
        hidden={props.hidden}
        anchorOrigin={{
          horizontal: align === 'center' ? 'center' : 'left',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: align === 'center' ? 'center' : 'left',
          vertical: 'top',
        }}
      />
    ),
    Badge,
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} size="small" variant="outlined" />,
    Spinner: CircularProgress,
  },
  icons: {
    ChevronRight,
    Clipboard: AssignmentReturn,
    Export: GetApp,
    Settings: Tune,
    ArrowDropDown,
    ArrowUpward,
    Clear,
    FilterList,
    Search,
  },
};

export function Mui4TableThemeProvider({ theme, children }: { theme?: DeepPartial<TableTheme>; children: ReactNode }) {
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
