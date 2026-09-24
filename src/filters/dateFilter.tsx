import type { ReactElement } from 'react';
import type { DatePickerProps, DateRange } from '../components/datePicker';
import { dateIntersect, DatePicker } from '../components/datePicker';
import type { FilterComponentProps } from '../types';
import { defineFilter } from './defineFilter';

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
  if (Array.isArray(x)) return x.map(convertDateOrRange).filter(Boolean) as (Date | DateRange)[];
  return convertDateOrRange(x);
}

type DateValue = Date | DateRange | null;

export type DateFilterOptions = {
  /** If enabled, only single days can be selected. Ranges otherwise. */
  singleSelect?: boolean;
} & Pick<
  DatePickerProps,
  | 'locale'
  | 'firstDayOfWeek'
  | 'defaultDateInView'
  | 'quickOptions'
  | 'minDate'
  | 'maxDate'
  | 'showCalendarWeek'
  | 'showTime'
>;

function DateFilterComponent({
  value = null,
  onChange,
  close,
  options: {
    locale,
    firstDayOfWeek,
    defaultDateInView,
    quickOptions,
    singleSelect,
    minDate,
    maxDate,
    showCalendarWeek,
    showTime,
  },
}: FilterComponentProps<DateValue, DateValue, DateFilterOptions>): ReactElement {
  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
      }}
    >
      <DatePicker
        rangeSelect={!singleSelect}
        value={value ?? null}
        onChange={(value, source) => {
          onChange(value);
          if (source !== 'input') {
            close();
          }
        }}
        locale={locale}
        firstDayOfWeek={firstDayOfWeek}
        defaultDateInView={defaultDateInView}
        quickOptions={quickOptions}
        minDate={minDate}
        maxDate={maxDate}
        showCalendarWeek={showCalendarWeek}
        showTime={showTime}
      />
    </div>
  );
}

export const dateFilter = defineFilter<DateValue, DateValue, DateFilterOptions>({
  isActive: (value) => !!value,
  test: (value, x) => dateIntersect(value, x),
  filterBy: convertDateOrArray,
  Component: DateFilterComponent,
});
