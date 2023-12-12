import type { Meta } from '@storybook/react';
import { useState } from 'react';
import { DatePicker, thisWeek, type DatePickerProps, type DateRange } from '../../src';

const today = new Date();
const nextWeek = new Date();
nextWeek.setDate(today.getDate() + 7);

function Wrapper(props: DatePickerProps) {
  const [date, setDate] = useState<Date | DateRange | null>(props.value ?? null);

  return (
    <div
      css={{
        display: 'flex',
        justifyContent: 'center',
      }}
    >
      <DatePicker
        {...props}
        value={date}
        onChange={(v) => {
          setDate(v);
          props.onChange(v);
        }}
      />
    </div>
  );
}

export default {
  title: 'Date Picker',
  component: DatePicker,
  render(props) {
    return <Wrapper {...props} />;
  },
  argTypes: {
    value: { control: 'date' },
    onChange: { action: 'changed' },
    blockedRanges: {
      control: 'object',
    },
  },
} satisfies Meta<typeof DatePicker>;

export const Simple = {
  args: {
    value: new Date(),
    onChange: () => undefined,
  } satisfies DatePickerProps,
};

export const Range = {
  args: {
    value: thisWeek(),
    onChange: () => undefined,
    rangeSelect: true,
  } satisfies DatePickerProps,
};

export const CalendarWeeks = () => {
  return (
    <div
      css={{
        display: 'flex',
        flexDirection: 'column',
        gap: 50,
        justifyContent: 'center',

        '& > div': {
          display: 'flex',
          gap: 50,
        },
      }}
    >
      {[2023, 2024, 2025, 2026].map((year) => (
        <div key={year}>
          <DatePicker
            value={null}
            onChange={() => undefined}
            dateInView={new Date(`${year - 1}-12-31`)}
            showCalendarWeek
            rangeSelect
          />
          <DatePicker
            value={null}
            onChange={() => undefined}
            dateInView={new Date(`${year}-01-01`)}
            showCalendarWeek
            rangeSelect
          />
        </div>
      ))}
    </div>
  );
};
