import { useFilter } from '../hooks/useFilter';
import type { CommonFilterProps } from '../types';
import type { DatePickerProps, DateRange } from './datePicker';
import { dateIntersect, DatePicker } from './datePicker';

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

export function DateFilter<T, V>({
  locale,
  firstDayOfWeek,
  defaultDateInView,
  quickOptions,
  singleSelect,
  filterBy = convertDateOrArray,
  minDate,
  maxDate,
  showCalendarWeek,
  ...props
}: {
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
> &
  CommonFilterProps<T, V, Date | DateRange | null, Date | DateRange | null>): JSX.Element {
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

  return (
    <div
      css={{
        padding: 'calc(var(--spacing) * 2)',
        display: 'grid',
      }}
    >
      <DatePicker
        rangeSelect={!singleSelect}
        value={value}
        onChange={onChange}
        locale={locale}
        firstDayOfWeek={firstDayOfWeek}
        defaultDateInView={defaultDateInView}
        quickOptions={quickOptions}
        minDate={minDate}
        maxDate={maxDate}
        showCalendarWeek={showCalendarWeek}
      />
    </div>
  );
}
