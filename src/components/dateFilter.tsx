import React, { useState } from 'react';
import ReactDatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useFilter, useTheme } from '..';
import { useDebounced } from '../hooks/useDebounced';

type Range = [Date, Date];
type PartialRange = [Date | null, Date | null];

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, -1);

const today = (): Range => {
  const now = new Date();
  return [startOfDay(now), endOfDay(now)];
};

export function DateFilter<T, V>({
  filterBy = (value) =>
    value instanceof Date ? value : typeof value === 'number' || typeof value === 'string' ? new Date(value) : new Date(0),
  value: controlledValue,
  defaultValue,
  onChange,
  locale,
  singleDate,
  dependencies = [],
}: {
  filterBy?: (value: V, item: T) => Date | Range;
  value?: PartialRange;
  defaultValue?: Range;
  onChange?: (value?: PartialRange) => void;
  locale?: Locale;
  singleDate?: boolean;
  dependencies?: any[];
}): JSX.Element {
  const {
    components: { Button },
    text,
  } = useTheme();

  const [stateValue, setStateValue] = useState<PartialRange>(defaultValue ?? [null, null]);
  const value = controlledValue ?? stateValue;
  const debouncedValue = useDebounced(value, 500);

  function update(value: PartialRange) {
    if (controlledValue === undefined) {
      setStateValue(value);
    }

    onChange?.(value);
  }

  useFilter<T, V>(
    {
      id: 'dateFilter',
      test:
        debouncedValue[0] && debouncedValue[1]
          ? (value, item) => {
              const x = filterBy(value, item);
              const [min0, max0] = x instanceof Array ? x : [x, x];
              const [min1, max1] = debouncedValue;
              return !!min1 && !!max1 && !(max0 < min1 || min0 >= max1);
            }
          : undefined,
      serialize: () => value.map((x) => x?.toISOString() ?? null),
      deserialize: ([start, end]) => update([start ? new Date(start) : null, end ? new Date(end) : null]),
    },
    [debouncedValue, ...dependencies],
  );

  const [start, end] = value ?? [];

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
          gap: 'var(--spacing)',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>{text.dateFilter}</div>

        <div css={{ display: 'grid', gridAutoFlow: 'column', gap: 'var(--spacing)' }}>
          <Button variant="contained" onClick={() => update(today())}>
            {text.today}
          </Button>
          <Button variant="contained" onClick={() => update([null, null])}>
            {text.reset}
          </Button>
        </div>
      </div>

      {singleDate ? (
        <ReactDatePicker
          selected={start}
          onChange={(d) => update([d, d ? endOfDay(d) : null])}
          startDate={start}
          endDate={end}
          inline
          showYearDropdown
          showMonthDropdown
          locale={locale}
          dateFormat="P"
        />
      ) : (
        <ReactDatePicker
          selected={start}
          onChange={([start, end]) => update([start, end ? endOfDay(end) : null])}
          startDate={start}
          endDate={end}
          inline
          showYearDropdown
          // showMonthDropdown
          selectsRange
          locale={locale}
          dateFormat="P"
        />
      )}
    </div>
  );
}
