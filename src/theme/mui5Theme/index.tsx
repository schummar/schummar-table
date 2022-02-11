import { ArrowDropDown, ArrowUpward, ChevronRight, Clear, ContentPaste, FileDownload, FilterList, Search, Tune } from '@mui/icons-material';
import { Badge, Button, Checkbox, CircularProgress, IconButton, Popover, TextField } from '@mui/material';
import { TableTheme } from '../../types';

export const mui5Theme: Partial<TableTheme> = {
  components: {
    Button: (props) => <Button {...props} size="small" fullWidth css={{ justifyContent: 'start !important' }} />,
    IconButton: (props) => <IconButton {...props} size="small" color="inherit" />,
    Checkbox: (props) => <Checkbox {...props} color="primary" size="medium" />,
    Popover: ({ align, ...props }) => (
      <Popover
        {...props}
        open={props.open ?? false}
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
    Spinner: CircularProgress,
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
