import { TableTheme } from '../../types';

export const Checkbox: TableTheme['components']['Checkbox'] = (props) => {
  return <input type="checkbox" {...props} />;
};
