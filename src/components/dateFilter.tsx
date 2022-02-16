import React, { useMemo } from 'react';
import { useFilter, useTheme } from '..';
import { CommonFilterProps } from '../types';
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
  locale,
  firstDayOfWeek,
  rangeSelect = true,
  filterBy = convertDateOrArray,
  ...props
}: {
  locale?: string;
  firstDayOfWeek?: DatePickerProps['firstDayOfWeek'];
  rangeSelect?: boolean;
} & CommonFilterProps<T, V, Date | DateRange | null, Date | DateRange | null>): JSX.Element {
  const {
    components: { Button },
    text,
  } = useTheme();

  const { value = null, onChange } = useFilter({
    ...props,
    filterBy,

    id: 'dateFilter',

    isActive(filterValue) {
      return !!filterValue;
    },

    test(filterValue, value) {
      return dateIntersect(filterValue, value);
    },
  });

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
          {!value
            ? text.dateFilter
            : value instanceof Date
            ? formatDate(value)
            : [formatDate(value.min), formatDate(value.max)].join(' - ')}
        </div>

        <div css={{ display: 'grid', gridAutoFlow: 'column', gap: 'var(--spacing)' }}>
          <Button variant="contained" onClick={() => onChange(today())}>
            {text.today}
          </Button>
          <Button variant="contained" onClick={() => onChange(null)}>
            {text.reset}
          </Button>
        </div>
      </div>

      <DatePicker rangeSelect={rangeSelect} value={value} onChange={onChange} locale={locale} firstDayOfWeek={firstDayOfWeek} />
    </div>
  );
}
