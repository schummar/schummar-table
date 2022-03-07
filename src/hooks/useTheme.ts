import { useTableContext } from '..';

export function useTheme() {
  const table = useTableContext();
  return table.useState('theme');
}
