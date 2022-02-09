import { Spinner } from '../components/spinnner';
import { TableTheme } from '../types';
import { Badge } from './components/badge';
import { Button } from './components/button';
import { Checkbox } from './components/checkbox';
import { IconButton } from './components/iconButton';
import { Popover } from './components/popover';
import { TextField } from './components/textField';

export const defaultComponents: TableTheme['components'] = {
  IconButton,
  Checkbox,
  Popover,
  Button,
  Badge,
  TextField,
  Spinner,
};
