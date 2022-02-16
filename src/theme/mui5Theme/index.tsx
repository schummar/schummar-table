import { ArrowDropDown, ArrowUpward, ChevronRight, Clear, ContentPaste, FileDownload, FilterList, Search, Tune } from '@mui/icons-material';
import { Badge, Button, Checkbox, CircularProgress, IconButton, Popover, TextField, useTheme } from '@mui/material';
import { ReactNode, useMemo } from 'react';
import { DeepPartial } from '../../misc/deepPartial';
import { TableTheme } from '../../types';
import { mergeThemes, TableThemeContext } from '../tableTheme';

export const mui5Theme: Partial<TableTheme> = {
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
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} size="small" />,
    Spinner: (props) => <CircularProgress {...props} size={20} />,
  },
  icons: {
    ChevronRight,
    Clipboard: ContentPaste,
    Export: FileDownload,
    Settings: Tune,
    ArrowDropDown,
    ArrowUpward,
    Clear,
    FilterList,
    Search,
  },
};

export function Mui5TableThemeProvider({ theme, children }: { theme?: DeepPartial<TableTheme>; children: ReactNode }) {
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
