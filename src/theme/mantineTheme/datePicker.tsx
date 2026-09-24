import { DatePicker, TimeInput } from '@mantine/dates';
import { useEffect, useState } from 'react';
import type { DatePickerProps } from '../../components/datePicker';
import { dateIntersect, DatePickerQuickOptions, endOfDay } from '../../components/datePicker';
import { useCssVariables } from '../useCssVariables';

const pad = (n: number) => String(n).padStart(2, '0');

// Mantine works with local `YYYY-MM-DD` strings; `new Date(string)` would parse them as UTC.
const toDateString = (date: Date) =>
  `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

const fromDateString = (value: string) => {
  const [year = 0, month = 1, day = 1] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export function MantineDatePicker(props: DatePickerProps) {
  const {
    value,
    onChange,
    rangeSelect,
    locale,
    firstDayOfWeek,
    defaultDateInView,
    minDate,
    maxDate,
    showCalendarWeek,
    blockedRanges = [],
    showTime,
  } = props;
  const cssVariables = useCssVariables();

  const min = value instanceof Date ? value : value?.min;
  const max = value instanceof Date ? value : value?.max;
  const [pendingMin, setPendingMin] = useState<string>();

  const [dateInViewLocal, setDateInViewLocal] = useState(
    () => max ?? defaultDateInView ?? new Date(),
  );
  const dateInView = props.dateInView ?? dateInViewLocal;

  function setDateInView(date: Date) {
    setDateInViewLocal(date);
    props.onDateInViewChange?.(date);
  }

  useEffect(() => {
    setDateInViewLocal(max ?? defaultDateInView ?? new Date());
  }, [max?.getTime(), defaultDateInView?.getTime()]);

  useEffect(() => {
    if (!rangeSelect) {
      setPendingMin(undefined);
    }
  }, [rangeSelect]);

  const calendarProps = {
    locale,
    firstDayOfWeek,
    minDate,
    maxDate,
    withWeekNumbers: showCalendarWeek,
    date: toDateString(dateInView),
    onDateChange: (date: string) => setDateInView(fromDateString(date)),
    getDayProps: (date: string) =>
      blockedRanges.some((range) => dateIntersect(fromDateString(date), range))
        ? { 'data-blocked': true }
        : {},
  };

  const showSeconds = typeof showTime === 'object' ? showTime.showSeconds !== false : true;

  return (
    <div
      css={[
        cssVariables,
        {
          display: 'grid',
          justifyItems: 'center',
          gap: 'var(--spacing)',

          '& [data-blocked]:not([data-selected]):not([data-in-range])': {
            backgroundColor: 'var(--mantine-color-red-light)',
            color: 'var(--mantine-color-red-light-color)',
          },

          '& [data-blocked][data-selected], & [data-blocked][data-in-range]': {
            boxShadow: 'inset 0 0 0 2px var(--mantine-color-red-filled)',
          },
        },
      ]}
    >
      {rangeSelect ? (
        <DatePicker
          {...calendarProps}
          type="range"
          allowSingleDateInRange
          value={
            pendingMin
              ? [pendingMin, null]
              : [min ? toDateString(min) : null, max ? toDateString(max) : null]
          }
          onChange={([start, end]) => {
            if (start && end) {
              setPendingMin(undefined);
              onChange(
                { min: fromDateString(start), max: endOfDay(fromDateString(end)) },
                'calendar',
              );
            } else {
              setPendingMin(start ?? undefined);
            }
          }}
        />
      ) : (
        <DatePicker
          {...calendarProps}
          value={min ? toDateString(min) : null}
          onChange={(date) => onChange(date ? fromDateString(date) : null, 'calendar')}
        />
      )}

      {showTime && (
        <div css={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing)' }}>
          <TimeField
            date={min}
            withSeconds={showSeconds}
            onChange={(newMin) =>
              onChange(
                rangeSelect && max ? { min: newMin, max: newMin > max ? newMin : max } : newMin,
                'input',
              )
            }
          />

          {rangeSelect && (
            <>
              {' - '}
              <TimeField
                date={max}
                withSeconds={showSeconds}
                onChange={(newMax) =>
                  min && onChange({ min: newMax < min ? newMax : min, max: newMax }, 'input')
                }
              />
            </>
          )}
        </div>
      )}

      <DatePickerQuickOptions {...props} onSelect={() => setPendingMin(undefined)} />
    </div>
  );
}

function TimeField({
  date,
  withSeconds,
  onChange,
}: {
  date?: Date;
  withSeconds: boolean;
  onChange: (date: Date) => void;
}) {
  const value = date
    ? [date.getHours(), date.getMinutes(), ...(withSeconds ? [date.getSeconds()] : [])]
        .map(pad)
        .join(':')
    : '';

  return (
    <TimeInput
      size="xs"
      withSeconds={withSeconds}
      disabled={!date}
      value={value}
      onChange={(event) => {
        const [hours, minutes, seconds = 0] = event.currentTarget.value.split(':').map(Number);
        if (!date || hours === undefined || minutes === undefined || Number.isNaN(hours)) {
          return;
        }

        const next = new Date(date);
        next.setHours(hours, minutes, seconds, 0);
        onChange(next);
      }}
    />
  );
}
