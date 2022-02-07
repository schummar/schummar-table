import { Badge, Button, Checkbox, IconButton, Popover, TextField } from '@material-ui/core';
import { ArrowDropDown, ArrowUpward, AssignmentReturn, ChevronRight, Clear, FilterList, GetApp, Search, Tune } from '@material-ui/icons';
import { TableTheme } from '../types';

export const materialUiTheme: Partial<TableTheme> = {
  components: {
    Button: (props) => <Button {...props} size="small" fullWidth />,
    IconButton: (props) => <IconButton {...props} size="small" />,
    Checkbox: (props) => <Checkbox {...props} color="primary" size="medium" />,
    Popover: (props) => <Popover {...props} open={props.open ?? false} />,
    Badge,
    TextField: ({ endIcon, ...props }) => <TextField {...props} InputProps={{ endAdornment: endIcon }} />,
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
