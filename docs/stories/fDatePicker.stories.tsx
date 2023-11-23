import { useState } from 'react';
import { DatePicker, DatePickerProps, DateRange } from '../../src';

export default {
  title: 'Date Picker',
  component: DatePicker,
  argTypes: {
    value: { control: 'date' },
    onChange: { action: 'changed' },
  },
};

export const Primary = (args: DatePickerProps) => {
  const [date, setDate] = useState<DateRange | null>(null);

  return (
    <DatePicker
      {...args}
      value={date}
      onChange={(v) => {
        if (v instanceof Date) {
          setDate({ min: v, max: v });
        } else {
          setDate(v);
        }
        args.onChange(v);
      }}
    />
  );
};

Primary.args = {
  value: new Date(),
};
