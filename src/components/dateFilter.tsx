import React, { useMemo, useState } from 'react';
import { useFilter, useTheme } from '..';
import { useDebounced } from '../hooks/useDebounced';
import { castArray } from '../misc/helpers';
import { dateIntersect, DatePicker, DatePickerProps, DateRange, today } from './datePicker';

function convertDate(x: unknown): Date | null {
  if (x instanceof Date) return x;
  if (typeof x === 'number' || typeof x === 'string') return new Date(x);
  return null;
}

function convertDateOrRange(x: unknown): Date | DateRange | null {
  if (x instanceof Object && 'min' in x && 'max' in x) {
    const range = {
      min: convertDate((x as any).min),
      max: convertDate((x as any).max),
    };
    return range.min && range.max ? (range as DateRange) : null;
  }
  return convertDate(x);
}

function convertDateOrArray(x: unknown): Date | DateRange | (Date | DateRange)[] | null {
  if (x instanceof Array) return x.map(convertDateOrRange).filter(Boolean) as (Date | DateRange)[];
  return convertDateOrRange(x);
}

export function DateFilter<T, V>({
  filterBy = convertDateOrArray,
  value: controlledValue,
  defaultValue,
  onChange,
  locale,
  firstDayOfWeek,
  range = true,
  dependencies = [],
}: {
  filterBy?: (value: V, item: T) => Date | DateRange | (Date | DateRange)[] | null;
  value?: Date | DateRange | null;
  defaultValue?: Date | DateRange | null;
  onChange?: (value?: Date | DateRange | null) => void;
  locale?: string;
  firstDayOfWeek?: DatePickerProps['firstDayOfWeek'];
  range?: boolean;
  dependencies?: any[];
}): JSX.Element {
  const {
    components: { Button },
    text,
  } = useTheme();

  const [stateValue, setStateValue] = useState<Date | DateRange | null>(defaultValue ?? null);
  const value = controlledValue ?? stateValue;
  const debouncedValue = useDebounced(value, 500);

  function update(value: Date | DateRange | null) {
    if (controlledValue === undefined) {
      setStateValue(value);
    }

    onChange?.(value);
  }

  useFilter<T, V>(
    {
      id: 'dateFilter',

      test: !debouncedValue
        ? undefined
        : (value, item) => {
            return castArray(filterBy(value, item)).some((x) => dateIntersect(x, debouncedValue));
          },

      serialize() {
        return value === null ? null : value instanceof Date ? value.getTime() : { min: value.min.getTime(), max: value.max.getTime() };
      },

      deserialize(value) {
        update(
          value === null ? null : typeof value === 'number' ? new Date(value) : { min: new Date(value.min), max: new Date(value.max) },
        );
      },
    },
    [debouncedValue, ...dependencies],
  );

  const formatDate = useMemo(() => {
    const { format } = new Intl.DateTimeFormat(locale, { dateStyle: 'medium' });
    return format;
  }, [locale]);

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
        gap: 'var(--spacing)',
        justifyItems: 'center',
      }}
    >
      <div
        css={{
          marginBottom: 'var(--spacing)',
          display: 'grid',
          gridAutoFlow: 'column',
          gap: 'calc(var(--spacing) * 4)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div css={{ minWidth: '22ch' }}>
          {value === null
            ? text.dateFilter
            : value instanceof Date
            ? formatDate(value)
            : [formatDate(value.min), formatDate(value.max)].join(' - ')}
        </div>

        <div css={{ display: 'grid', gridAutoFlow: 'column', gap: 'var(--spacing)' }}>
          <Button variant="contained" onClick={() => update(today())}>
            {text.today}
          </Button>
          <Button variant="contained" onClick={() => update(null)}>
            {text.reset}
          </Button>
        </div>
      </div>

      <DatePicker range={range} value={value} onChange={update} locale={locale} firstDayOfWeek={firstDayOfWeek} />
    </div>
  );
}
