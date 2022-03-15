import { useDayzed } from 'dayzed';
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '..';
import { gray } from '../theme/defaultTheme/defaultClasses';
import { useCssVariables } from '../theme/useCssVariables';

export type DateRange = { min: Date; max: Date };

export type DatePickerProps = {
  /** Currently selected day or range of days. */
  value: Date | DateRange | null;
  /** Callback for when the day (range) changes. */
  onChange: (value: Date | DateRange | null) => void;
  /** If enabled, ranges can be selected. */
  rangeSelect?: boolean;
  /** Which locale to use to render the calendar. */
  locale?: string;
  /** Which day of the week should be in the first column. */
  firstDayOfWeek?: 0 | 1 | 2 | 3 | 4 | 5 | 6;
};

const weekDays = [0, 1, 2, 3, 4, 5, 6] as const;
const months = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] as const;

/** Rounds a date down to the start of the day. */
export const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** Rounds a date up to the end of the day. */
export const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1, 0, 0, 0, -1);

/** Returns whether two dates and/or date ranges intersect. Intersection is considered per day. */
export function dateIntersect(a: Date | null | DateRange, b: Date | null | DateRange) {
  if (a instanceof Date) {
    a = { min: a, max: a };
  }
  if (b instanceof Date) {
    b = { min: b, max: b };
  }

  if (!a?.min || !a.max || !b?.min || !b.max) {
    return false;
  }

  return !(endOfDay(a.max) < startOfDay(b.min) || startOfDay(a.min) > endOfDay(b.max));
}

export function DatePicker({ value, onChange, rangeSelect, locale, firstDayOfWeek = 0 }: DatePickerProps) {
  const {
    components: { IconButton },
    icons: { ChevronRight },
  } = useTheme();

  const [baseDate] = useState(new Date());
  const [dateInView, setDateInView] = useState<Date>(baseDate);
  const [currentMin, setCurrentMin] = useState<Date>();
  const [hovered, setHovered] = useState<Date>();

  const min = currentMin ?? (value instanceof Date ? value : value?.min);
  const max = currentMin ? undefined : value instanceof Date ? value : value?.max;

  const { calendars, getBackProps, getForwardProps, getDateProps } = useDayzed({
    onDateSelected: () => undefined,
    firstDayOfWeek,
    showOutsideDays: true,
    date: dateInView,
    onOffsetChanged: (offset) => setDateInView(new Date(dateInView.getFullYear(), dateInView.getMonth() + offset)),
    offset: 0,
  });

  const formatWeekday = useMemo(() => {
    const { format } = new Intl.DateTimeFormat(locale, { weekday: 'short' });
    return (weekDay: number) => format(new Date(Date.UTC(2021, 5, weekDay)));
  }, [locale]);

  useEffect(() => setDateInView(value === null ? new Date() : value instanceof Date ? value : value.max), [value]);

  return (
    <div>
      {calendars.map(({ month, year, weeks }) => (
        <div key={`${month}${year}`}>
          <div
            css={{
              margin: 'calc(var(--spacing) * 4) 0',
              display: 'grid',
              gridAutoFlow: 'column',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <IconButton {...getBackProps({ calendars })}>
              <ChevronRight css={{ transform: 'rotate3d(0, 0, 1, 180deg)' }} />
            </IconButton>

            <div css={{ display: 'flex' }}>
              <MonthSelector value={month} onChange={(month) => setDateInView(new Date(year, month))} locale={locale} />

              <YearSelector value={year} onChange={(year) => setDateInView(new Date(year, month))} />
            </div>

            <IconButton {...getForwardProps({ calendars })}>
              <ChevronRight />
            </IconButton>
          </div>

          <div
            css={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, max-content)',
              fontWeight: 'bold',
            }}
          >
            {weekDays.map((_v, weekDay) => (
              <div key={weekDay} css={{ justifySelf: 'center', marginBottom: 'var(--spacing)' }}>
                {formatWeekday(weekDay)}
              </div>
            ))}

            {weeks.map((week, index) =>
              week.map((dateObj, dayIndex) => {
                if (!dateObj) {
                  return <div />;
                }

                const { prevMonth, nextMonth, date, today } = dateObj;

                const selected = date.getTime() === min?.getTime() || (min && max && dateIntersect(date, { min, max }));
                const preSelected =
                  !selected &&
                  (date.getTime() === hovered?.getTime() ||
                    (min && !max && hovered && dateIntersect(date, min <= hovered ? { min, max: hovered } : { min: hovered, max: min })));

                return (
                  <button
                    key={`${index}-${dayIndex}`}
                    css={[
                      {
                        padding: 10,
                        border: '1px solid transparent',
                        background: 'transparent',
                        cursor: 'pointer',
                      },
                      (prevMonth || nextMonth) && {
                        color: gray,
                      },
                      today && {
                        border: '1px solid var(--secondaryMain)',
                      },
                      selected && {
                        background: 'var(--primaryMain)',
                        color: 'var(--primaryContrastText)',
                      },
                      preSelected && {
                        background: 'var(--primaryLight)',
                        color: 'var(--primaryContrastText)',
                      },
                    ]}
                    {...getDateProps({ dateObj })}
                    onClick={() => {
                      if (!rangeSelect) {
                        setCurrentMin(undefined);
                        onChange(date);
                      } else if (min && !max) {
                        setCurrentMin(undefined);
                        if (date > min) {
                          onChange({ min, max: date });
                        } else {
                          onChange({ min: date, max: min });
                        }
                      } else {
                        setCurrentMin(date);
                      }
                    }}
                    onPointerOver={() => setHovered(date)}
                    onPointerOut={() => setHovered(undefined)}
                  >
                    {date.getDate()}
                  </button>
                );
              }),
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function MonthSelector({ value, onChange, locale }: { value: number; onChange: (month: number) => void; locale?: string }) {
  const {
    components: { Popover },
  } = useTheme();
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element>();

  const formatMonth = useMemo(() => {
    const { format } = new Intl.DateTimeFormat(locale, { month: 'long' });
    return (month: number) => format(new Date(2021, month));
  }, [locale]);

  return (
    <>
      <button
        css={{
          border: 'none',
          background: 'transparent',
          fontSize: 'inherit',
          cursor: 'pointer',
        }}
        onClick={(e) => setAnchor(e.currentTarget)}
      >
        {formatMonth(value)}
      </button>

      <Popover open={!!anchor} anchorEl={anchor ?? null} onClose={() => setAnchor(undefined)} align="center" css={cssVariables}>
        <div
          css={{
            display: 'grid',
          }}
        >
          {months.map((month) => (
            <button
              key={month}
              css={[
                {
                  padding: 'var(--spacing)',
                  border: 'none',
                  background: 'transparent',

                  '&:hover': {
                    background: 'var(--primaryLight)',
                  },
                },
                month === value && { background: 'var(--primaryMain)' },
              ]}
              onClick={() => onChange(month)}
            >
              {formatMonth(month)}
            </button>
          ))}
        </div>
      </Popover>
    </>
  );
}

function YearSelector({ value, onChange, locale }: { value: number; onChange: (year: number) => void; locale?: string }) {
  const [input, setInput] = useState<string>();
  const ref = useRef<HTMLInputElement>(null);

  function apply() {
    onChange(Number(input));
    setInput(undefined);
  }

  const formatYear = useMemo(() => {
    const { format } = new Intl.DateTimeFormat(locale, { year: 'numeric' });
    return (year: number) => format(new Date(year, 0, 1));
  }, [locale]);

  useLayoutEffect(() => ref.current?.focus(), [ref.current]);

  if (input === undefined) {
    return <div onClick={() => setInput(String(value))}>{formatYear(value)}</div>;
  }

  return (
    <input
      ref={ref}
      css={{ width: '4ch' }}
      value={input}
      onChange={(e) => {
        if (e.target.value.match(/^\d{0,4}$/)) {
          setInput(e.target.value);
        }
      }}
      onBlur={apply}
      onKeyPress={(e) => e.key === 'Enter' && apply()}
    ></input>
  );
}
