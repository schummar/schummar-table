import { useFilter } from '..';
import { CommonFilterProps } from '../types';
import { dateIntersect, DatePicker, DatePickerProps, DateRange } from './datePicker';

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
  defaultDateInView,
  quickOptions,
  singleSelect,
  filterBy = convertDateOrArray,
  ...props
}: {
  /** If enabled, only single days can be selected. Ranges otherwise. */
  singleSelect?: boolean;
} & Pick<DatePickerProps, 'locale' | 'firstDayOfWeek' | 'defaultDateInView' | 'quickOptions'> &
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
      />
    </div>
  );
}
