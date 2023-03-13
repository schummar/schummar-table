import { useFilter } from '../hooks/useFilter';
import { useTheme } from '../hooks/useTheme';
import { asNumberOrArray, castArray } from '../misc/helpers';
import { useColumnContext, useTableContext } from '../misc/tableContext';
import type { CommonFilterProps } from '../types';
import { NumberField } from './numberField';

export interface RangeFilterProps<T, V>
  extends CommonFilterProps<T, V, number | null, [number | null, number | null] | null> {
  min?: number;
  max?: number;
}

export function RangeFilter<T, V>({
  min,
  max,
  filterBy = asNumberOrArray,
  ...props
}: RangeFilterProps<T, V>): JSX.Element {
  const rangeMinText = useTheme((t) => t.text.rangeMin);
  const rangeMaxText = useTheme((t) => t.text.rangeMax);

  const table = useTableContext<T>();
  const columnId = useColumnContext();
  const filterByFunction = filterBy instanceof Function ? filterBy : filterBy[0];

  const [minValue, maxValue] = table.useState((state) => {
    if (typeof min === 'number' && typeof max === 'number') {
      return [min, max];
    }

    const column = state.activeColumns.find((c) => c.id === columnId);

    if (!column) {
      return [0, 100];
    }

    let minValue;
    let maxValue;

    for (const item of state.items) {
      const columnValue = column.value(item.value) as V;
      const numberValues = castArray(filterByFunction(columnValue, item.value)).filter(
        (value): value is number => value !== null,
      );

      for (const value of numberValues) {
        minValue = Math.min(minValue ?? value, value);
        maxValue = Math.max(maxValue ?? value, value);
      }
    }

    return [min ?? minValue, max ?? maxValue];
  });

  const { value, onChange } = useFilter({
    ...props,
    filterBy,

    id: 'rangeFilter',

    isActive(filterValue) {
      return !!filterValue;
    },

    test(filterValue, value) {
      if (!filterValue || (filterValue[0] === null && filterValue[1] === null)) {
        return true;
      }

      const min = filterValue[0] ?? Number.NEGATIVE_INFINITY;
      const max = filterValue[1] ?? Number.POSITIVE_INFINITY;
      return value !== null && value >= min && value <= max;
    },
  });

  return (
    <div
      css={{
        padding: `calc(var(--spacing) * 2)`,
        display: 'grid',
        gap: '1em',
      }}
    >
      <div
        css={{
          display: 'flex',
          gap: '1em',
          alignItems: 'center',

          '& > *': {
            width: '10em',
          },
        }}
      >
        <NumberField
          value={value?.[0]}
          onChange={(newMin) => onChange(normalize(newMin, value?.[1], 'min', { min, max }))}
          startIcon={<span css={{ margin: '0 calc(var(--spacing) * 2)' }}>{rangeMinText}</span>}
          placeholder={String(minValue ?? '')}
          css={{
            alignItems: 'baseline',
          }}
        />
        -
        <NumberField
          value={value?.[1]}
          onChange={(newMax) => onChange(normalize(value?.[0], newMax, 'max', { min, max }))}
          startIcon={<span css={{ margin: '0 calc(var(--spacing) * 2)' }}>{rangeMaxText}</span>}
          placeholder={String(maxValue ?? '')}
          css={{
            alignItems: 'baseline',
          }}
        />
      </div>
    </div>
  );
}

function normalize(
  min: number | null | undefined,
  max: number | null | undefined,
  changed: 'min' | 'max',
  limits: { min?: number; max?: number },
): [number | null, number | null] | null {
  min ??= null;
  max ??= null;

  if (min !== null && max !== null && min > max) {
    if (changed === 'min') {
      max = min;
    } else {
      min = max;
    }
  }

  return min !== null || max !== null
    ? [clamp(min, limits.min, limits.max), clamp(max, limits.min, limits.max)]
    : null;
}

function clamp(
  value: number | null,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY,
): number | null {
  return value === null ? null : Math.min(Math.max(value, min), max);
}
