import { useTheme } from '../hooks/useTheme';
import { useTableActions } from '../state/context';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';

export default function ClearFiltersButton<T>() {
  const Button = useTheme((t) => t.components.Button);
  const textClearFilters = useTheme((t) => t.text.clearFilters);
  const actions = useTableActions<T>();

  return (
    <div css={defaultClasses.clearFiltersButton}>
      <Button variant="outlined" onClick={() => actions.clearFilters()}>
        {textClearFilters}
      </Button>
    </div>
  );
}
