import type { ReactElement } from 'react';
import type { DatePickerProps, DateRange } from '../components/datePicker';
import { dateIntersect, DatePicker } from '../components/datePicker';
import { toSingles } from '../misc/helpers';
import type { FilterComponentProps, SingleOrMultiple } from '../types';
import { defineFilter } from './defineFilter';

/** An ISO 8601 date or date-time string, e.g. `2024-05-03` or `2024-05-03T13:47:23Z`. */
export type ISODate = `${number}-${number}-${number}${string}`;

type DateValue = Date | DateRange | null;
type DateInput = SingleOrMultiple<Date | DateRange | ISODate | null | undefined>;

const toDate = (x: Date | DateRange | ISODate | null | undefined) =>
  typeof x === 'string' ? new Date(x) : x;

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
}: FilterComponentProps<DateInput, DateValue, DateFilterOptions>): ReactElement {
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

export const dateFilter = defineFilter<DateInput, DateValue, DateFilterOptions>({
  isActive: (value) => !!value,
  test: (value, input) => toSingles(input).some((x) => dateIntersect(value, toDate(x))),
  Component: DateFilterComponent,
});
