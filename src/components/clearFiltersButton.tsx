import { useTheme } from '../hooks/useTheme';
import { useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';

export default function ClearFiltersButton<T>() {
  const Button = useTheme((t) => t.components.Button);
  const textClearFilters = useTheme((t) => t.text.clearFilters);
  const table = useTableContext<T>();

  return (
    <div css={defaultClasses.clearFiltersButton}>
      <Button
        variant="outlined"
        onClick={() => {
          table.update((state) => {
            state.activeColumns.forEach((column) => {
              state.filterValues.delete(column.id);
            });
          });
        }}
      >
        {textClearFilters}
      </Button>
    </div>
  );
}
