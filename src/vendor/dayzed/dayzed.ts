import { HTMLProps, SyntheticEvent, useState } from 'react';

import {
  composeEventHandlers,
  requiredProp,
  subtractMonth,
  addMonth,
  isBackDisabled,
  isForwardDisabled,
  getCalendars,
  type DayzedDateObject,
  type DayzedCalendar,
} from './utils';

function isOffsetControlled(propOffset: number | undefined) {
  return propOffset !== undefined;
}

function getOffset(prop: number | undefined, state: number) {
  return isOffsetControlled(prop) ? prop : state;
}

function getDateProps(
  onDateSelected: ((date: DayzedDateObject, event: SyntheticEvent) => void) | undefined,
  {
    onClick,
    dateObj = requiredProp('getDateProps', 'dateObj'),
    ...rest
  }: Partial<GetDatePropsOptions> = {},
) {
  return {
    onClick: composeEventHandlers(onClick as any, (event) => {
      onDateSelected?.(dateObj, event);
    }),
    disabled: !dateObj.selectable,
    'aria-label': dateObj.date.toDateString(),
    'aria-pressed': dateObj.selected,
    role: 'button',
    ...rest,
  };
}

function getBackProps(
  {
    minDate,
    offsetMonth,
    handleOffsetChanged,
  }: {
    minDate?: Date;
    offsetMonth: number;
    handleOffsetChanged: (offset: number) => void;
  },
  {
    onClick,
    offset = 1,
    calendars = requiredProp('getBackProps', 'calendars'),
    ...rest
  }: Partial<GetBackForwardPropsOptions> = {},
) {
  return {
    onClick: composeEventHandlers(onClick as any, () => {
      handleOffsetChanged(offsetMonth - subtractMonth({ calendars, offset, minDate }));
    }),
    disabled: isBackDisabled({ calendars, minDate }),
    'aria-label': `Go back ${offset} month${offset === 1 ? '' : 's'}`,
    ...rest,
  };
}

function getForwardProps(
  {
    maxDate,
    offsetMonth,
    handleOffsetChanged,
  }: {
    maxDate?: Date;
    offsetMonth: number;
    handleOffsetChanged: (offset: number) => void;
  },
  {
    onClick,
    offset = 1,
    calendars = requiredProp('getForwardProps', 'calendars'),
    ...rest
  }: Partial<GetBackForwardPropsOptions> = {},
) {
  return {
    onClick: composeEventHandlers(onClick as any, () => {
      handleOffsetChanged(offsetMonth + addMonth({ calendars, offset, maxDate }));
    }),
    disabled: isForwardDisabled({ calendars, maxDate }),
    'aria-label': `Go forward ${offset} month${offset === 1 ? '' : 's'}`,
    ...rest,
  };
}

export function useDayzed({
  date = new Date(),
  maxDate,
  minDate,
  monthsToDisplay = 1,
  firstDayOfWeek = 0,
  showOutsideDays = false,
  offset,
  onDateSelected,
  onOffsetChanged = () => {},
  selected,
}: {
  date?: Date;
  maxDate?: Date;
  minDate?: Date;
  monthsToDisplay?: number;
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
  showOutsideDays?: boolean;
  selected?: Date | Date[];
  offset?: number;
  onOffsetChanged?(offset: number): void;
  onDateSelected(selectedDate: DayzedDateObject, event: SyntheticEvent): void;
}): RenderProps {
  const [stateOffset, setStateOffset] = useState(0);
  const offsetMonth = getOffset(offset, stateOffset);

  function handleOffsetChanged(newOffset: number) {
    if (!isOffsetControlled(offset)) {
      setStateOffset(newOffset);
    }
    onOffsetChanged(newOffset);
  }

  const calendars = getCalendars({
    date,
    selected: Array.isArray(selected) ? selected : selected ? [selected] : [],
    monthsToDisplay,
    minDate,
    maxDate,
    offset: offsetMonth,
    firstDayOfWeek,
    showOutsideDays,
  });
  return {
    calendars,
    getDateProps: getDateProps.bind(null, onDateSelected),
    getBackProps: getBackProps.bind(null, {
      minDate,
      offsetMonth,
      handleOffsetChanged,
    }),
    getForwardProps: getForwardProps.bind(null, {
      maxDate,
      offsetMonth,
      handleOffsetChanged,
    }),
  };
}

interface GetBackForwardPropsOptions extends HTMLProps<HTMLButtonElement> {
  calendars: DayzedCalendar[];
  offset?: number;
}

interface GetDatePropsOptions extends HTMLProps<HTMLButtonElement> {
  dateObj: DayzedDateObject;
}

interface RenderProps {
  calendars: DayzedCalendar[];
  getBackProps: (data: GetBackForwardPropsOptions) => Record<string, any>;
  getForwardProps: (data: GetBackForwardPropsOptions) => Record<string, any>;
  getDateProps: (data: GetDatePropsOptions) => Record<string, any>;
}

export type { DayzedDateObject } from './utils';
