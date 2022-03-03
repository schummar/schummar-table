import React, { useMemo } from 'react';
import { useFilter, useTheme } from '..';
import { CommonFilterProps } from '../types';
import { dateIntersect, DatePicker, DatePickerProps, DateRange, endOfDay, startOfDay } from './datePicker';

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
  singleSelect,
  filterBy = convertDateOrArray,
  ...props
}: {
  locale?: string;
  firstDayOfWeek?: DatePickerProps['firstDayOfWeek'];
  singleSelect?: boolean;
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
      }}
    >
      {!singleSelect && (
        <div
          css={{
            marginBottom: 'var(--spacing)',
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          {value ? formatDate(value instanceof Date ? value : value.min) : ''} -{' '}
          {value ? formatDate(value instanceof Date ? value : value.max) : ''}
        </div>
      )}

      <DatePicker rangeSelect={!singleSelect} value={value} onChange={onChange} locale={locale} firstDayOfWeek={firstDayOfWeek} />

      <div css={{ marginTop: 'var(--spacing)', display: 'grid', gridAutoFlow: 'column', justifyContent: 'center' }}>
        <Button variant="text" onClick={() => onChange(today())}>
          {text.today}
        </Button>

        <Button variant="text" onClick={() => onChange(thisWeek(firstDayOfWeek))}>
          {text.thisWeek}
        </Button>

        <Button variant="text" onClick={() => onChange(null)}>
          {text.reset}
        </Button>
      </div>
    </div>
  );
}

export const today = (): DateRange => {
  const today = startOfDay(new Date());
  return { min: today, max: today };
};

export const thisWeek = (firstDayOfWeek = 0): DateRange => {
  const now = new Date();
  const min = new Date(now);

  let diff = min.getDay() - firstDayOfWeek;
  if (diff < 0) {
    diff += 7;
  }
  min.setDate(min.getDate() - diff);

  const max = new Date(min);
  max.setDate(max.getDate() + 6);

  return { min: startOfDay(min), max: endOfDay(max) };
};
