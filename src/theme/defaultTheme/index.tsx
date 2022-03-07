import { TableTheme } from '../../types';
import { defaultColors } from './defaultColors';
import { defaultComponents } from './defaultComponents';
import { defaultIcons } from './defaultIcons';
import { defaultTexts } from './defaultTexts';

export const defaultTableTheme: TableTheme = {
  text: defaultTexts,
  components: defaultComponents,
  icons: defaultIcons,
  colors: defaultColors,
  spacing: '5px',
};
