import { afterEach, beforeEach, describe, expect, test, vi } from 'vite-plus/test';
import {
  commonQuickOptions,
  dateClamp,
  dateIntersect,
  endOfDay,
  getCalendarWeek,
  lastDays,
  startOfDay,
  thisMonth,
  thisWeek,
  thisYear,
  today,
} from './datePicker';

afterEach(() => {
  vi.useRealTimers();
});

describe('startOfDay / endOfDay', () => {
  test('startOfDay rounds down to midnight', () => {
    expect(startOfDay(new Date(2024, 0, 15, 13, 45, 30))).toEqual(
      new Date(2024, 0, 15, 0, 0, 0, 0),
    );
  });

  test('endOfDay rounds up to the last millisecond of the day', () => {
    expect(endOfDay(new Date(2024, 0, 15, 13, 45, 30))).toEqual(
      new Date(2024, 0, 15, 23, 59, 59, 999),
    );
  });

  test('endOfDay rolls over at a month boundary', () => {
    expect(endOfDay(new Date(2024, 0, 31))).toEqual(new Date(2024, 0, 31, 23, 59, 59, 999));
  });
});

describe('dateClamp', () => {
  test('returns the date unchanged when within bounds', () => {
    const date = new Date(2024, 0, 15);
    expect(dateClamp(date, new Date(2024, 0, 1), new Date(2024, 0, 31))).toBe(date);
  });

  test('clamps to min when below range', () => {
    const min = new Date(2024, 0, 10);
    expect(dateClamp(new Date(2024, 0, 1), min)).toBe(min);
  });

  test('clamps to max when above range', () => {
    const max = new Date(2024, 0, 10);
    expect(dateClamp(new Date(2024, 0, 20), undefined, max)).toBe(max);
  });

  test('returns the date unchanged when no bounds are given', () => {
    const date = new Date(2024, 0, 15);
    expect(dateClamp(date)).toBe(date);
  });
});

describe('dateIntersect', () => {
  test('overlapping ranges intersect', () => {
    const a = { min: new Date(2024, 0, 1), max: new Date(2024, 0, 10) };
    const b = { min: new Date(2024, 0, 5), max: new Date(2024, 0, 15) };
    expect(dateIntersect(a, b)).toBe(true);
  });

  test('adjacent ranges on different days do not intersect', () => {
    const a = { min: new Date(2024, 0, 1), max: new Date(2024, 0, 5) };
    const b = { min: new Date(2024, 0, 6), max: new Date(2024, 0, 10) };
    expect(dateIntersect(a, b)).toBe(false);
  });

  test('a single date intersects a range it falls within', () => {
    const a = new Date(2024, 0, 5);
    const b = { min: new Date(2024, 0, 1), max: new Date(2024, 0, 10) };
    expect(dateIntersect(a, b)).toBe(true);
  });

  test('two equal dates intersect (considered per day)', () => {
    expect(dateIntersect(new Date(2024, 0, 5, 3), new Date(2024, 0, 5, 20))).toBe(true);
  });

  test('null/undefined never intersects', () => {
    expect(dateIntersect(null, { min: new Date(), max: new Date() })).toBe(false);
    expect(dateIntersect(undefined, undefined)).toBe(false);
  });
});

describe('getCalendarWeek', () => {
  // ISO 8601: 2021-01-01 falls in week 53 of 2020.
  test('2021-01-01 is week 53', () => {
    expect(getCalendarWeek(new Date(2021, 0, 1))).toBe(53);
  });

  // ISO 8601: 2024-12-30 already falls in week 1 of 2025.
  test('2024-12-30 is week 1', () => {
    expect(getCalendarWeek(new Date(2024, 11, 30))).toBe(1);
  });

  test('a date in the middle of the year has the expected week', () => {
    expect(getCalendarWeek(new Date(2024, 0, 15))).toBe(3);
  });
});

describe('relative date ranges', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  test('today returns the current day', () => {
    expect(today()).toEqual({
      min: new Date(2024, 0, 15, 0, 0, 0, 0),
      max: new Date(2024, 0, 15, 23, 59, 59, 999),
    });
  });

  test('lastDays(7) spans the last 7 days including today', () => {
    expect(lastDays(7)).toEqual({
      min: new Date(2024, 0, 9, 0, 0, 0, 0),
      max: new Date(2024, 0, 15, 23, 59, 59, 999),
    });
  });

  test('thisWeek defaults to Monday-first week', () => {
    // 2024-01-15 is a Monday.
    expect(thisWeek()).toEqual({
      min: new Date(2024, 0, 15, 0, 0, 0, 0),
      max: new Date(2024, 0, 21, 23, 59, 59, 999),
    });
  });

  test('thisWeek with firstDayOfWeek=0 starts on Sunday', () => {
    expect(thisWeek(0, 0)).toEqual({
      min: new Date(2024, 0, 14, 0, 0, 0, 0),
      max: new Date(2024, 0, 20, 23, 59, 59, 999),
    });
  });

  test('thisWeek with a delta shifts by whole weeks', () => {
    expect(thisWeek(-1)).toEqual({
      min: new Date(2024, 0, 8, 0, 0, 0, 0),
      max: new Date(2024, 0, 14, 23, 59, 59, 999),
    });
  });

  test('thisMonth spans the full current month', () => {
    expect(thisMonth()).toEqual({
      min: new Date(2024, 0, 1, 0, 0, 0, 0),
      max: new Date(2024, 0, 31, 23, 59, 59, 999),
    });
  });

  test('thisMonth with a delta shifts by whole months', () => {
    expect(thisMonth(1)).toEqual({
      min: new Date(2024, 1, 1, 0, 0, 0, 0),
      max: new Date(2024, 1, 29, 23, 59, 59, 999),
    });
  });

  test('thisYear spans the full current year', () => {
    expect(thisYear()).toEqual({
      min: new Date(2024, 0, 1, 0, 0, 0, 0),
      max: new Date(2024, 11, 31, 23, 59, 59, 999),
    });
  });

  test('thisYear with a delta shifts by whole years', () => {
    expect(thisYear(-1)).toEqual({
      min: new Date(2023, 0, 1, 0, 0, 0, 0),
      max: new Date(2023, 11, 31, 23, 59, 59, 999),
    });
  });
});

describe('commonQuickOptions', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2024, 0, 15, 12, 0, 0));
  });

  test('today option resolves to the current day', () => {
    expect(commonQuickOptions.today.value()).toEqual(today());
  });

  test('lastSevenDays option resolves to lastDays(7)', () => {
    expect(commonQuickOptions.lastSevenDays.value()).toEqual(lastDays(7));
  });

  test('lastThirtyDays option resolves to lastDays(30)', () => {
    expect(commonQuickOptions.lastThirtyDays.value()).toEqual(lastDays(30));
  });

  test('thisMonth option resolves to thisMonth()', () => {
    expect(commonQuickOptions.thisMonth.value()).toEqual(thisMonth());
  });

  test('thisYear option resolves to thisYear()', () => {
    expect(commonQuickOptions.thisYear.value()).toEqual(thisYear());
  });

  test('thisWeek option forwards firstDayOfWeek from props', () => {
    const props = { firstDayOfWeek: 0 } as Parameters<
      (typeof commonQuickOptions)['thisWeek']['value']
    >[0];
    expect(commonQuickOptions.thisWeek.value(props)).toEqual(thisWeek(0, 0));
  });
});
