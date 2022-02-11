import { Spinner } from '../../components/spinnner';
import { TableTheme } from '../../types';
import { Badge } from './badge';
import { Button } from './button';
import { Checkbox } from './checkbox';
import { IconButton } from './iconButton';
import { Popover } from './popover';
import { TextField } from './textField';

export const defaultComponents: TableTheme['components'] = {
  IconButton,
  Checkbox,
  Popover,
  Button,
  Badge,
  TextField,
  Spinner,
};
