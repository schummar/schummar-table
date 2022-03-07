import { defaultComponents } from '.';
import { TableTheme } from '../../types';
import { defaultColors } from '../defaultColors';
import { defaultIcons } from '../defaultIcons';
import { defaultTexts } from '../defaultTexts';

export const defaultTableTheme: TableTheme = {
  text: defaultTexts,
  components: defaultComponents,
  icons: defaultIcons,
  colors: defaultColors,
  spacing: '5px',
};
