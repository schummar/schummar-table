import { useMemo, type ReactElement } from 'react';
import { NumberField } from '../components/numberField';
import { useTheme } from '../hooks/useTheme';
import { asNumberOrArray } from '../misc/helpers';
import type { FilterComponentProps } from '../types';
import { defineFilter } from './defineFilter';

type Range = [number | null, number | null] | null;

export interface RangeFilterOptions {
  min?: number;
  max?: number;
}

function RangeFilterComponent({
  value,
  onChange,
  options: { min, max },
  getValues,
}: FilterComponentProps<number | null, Range, RangeFilterOptions>): ReactElement {
  const rangeMinText = useTheme((t) => t.text.rangeMin);
  const rangeMaxText = useTheme((t) => t.text.rangeMax);

  const [minValue, maxValue] = useMemo(() => {
    if (typeof min === 'number' && typeof max === 'number') {
      return [min, max];
    }

    let minValue;
    let maxValue;

    for (const value of getValues()) {
      if (value === null) continue;
      minValue = Math.min(minValue ?? value, value);
      maxValue = Math.max(maxValue ?? value, value);
    }

    return [min ?? minValue, max ?? maxValue];
  }, [min, max, getValues]);

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

export const rangeFilter = defineFilter<number | null, Range, RangeFilterOptions>({
  isActive: (value) => !!value,
  test(value, x) {
    if (!value || (value[0] === null && value[1] === null)) {
      return true;
    }

    const min = value[0] ?? Number.NEGATIVE_INFINITY;
    const max = value[1] ?? Number.POSITIVE_INFINITY;
    return x !== null && x >= min && x <= max;
  },
  filterBy: asNumberOrArray,
  Component: RangeFilterComponent,
});

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
