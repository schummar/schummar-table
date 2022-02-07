import { ArrowDropDown, ArrowUpward, ChevronRight, Clear, ContentPaste, FileDownload, FilterList, Search, Tune } from '@mui/icons-material';
import { Badge, Button, Checkbox, IconButton, Popover, TextField } from '@mui/material';
import { TableTheme } from '../types';

export const muiTheme: Partial<TableTheme> = {
  components: {
    Button: (props) => <Button {...props} size="small" fullWidth css={{ justifyContent: 'start !important' }} />,
    IconButton: (props) => <IconButton {...props} size="small" color="inherit" />,
    Checkbox: (props) => <Checkbox {...props} color="primary" size="medium" />,
    Popover: (props) => (
      <Popover
        {...props}
        open={props.open ?? false}
        anchorOrigin={{
          horizontal: 'center',
          vertical: 'bottom',
        }}
        transformOrigin={{
          horizontal: 'left',
          vertical: 'top',
        }}
      />
    ),
    Badge,
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} size="small" />,
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
