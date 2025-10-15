import { nanoid } from 'nanoid';
import { Fragment, useMemo, useState } from 'react';
import { debounce } from '../misc/debounce';

export interface TimeInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  locale?: string;
  showSeconds?: boolean;
}

type Part = 'hour' | 'minute' | 'second';

const className = 'schummar-table-time-input';
const defaultDate = new Date(1970, 0, 1);

const isIncludedType = (type: Intl.DateTimeFormatPartTypes): type is Part =>
  type === 'hour' || type === 'minute' || type === 'second';

const maxValues = {
  hour: 23,
  minute: 59,
  second: 59,
};

const tabNext = (event: Element, id: string) => {
  const all = Array.from(document.querySelectorAll(`.${className}-${id}`));
  const index = all.indexOf(event);
  const next = all[index + 1];

  if (next instanceof HTMLElement) {
    next.focus();
  }
};

function buildTime(value: Partial<Record<Part, string>>, baseDate = new Date()): Date {
  const date = new Date(baseDate);

  if (value.hour) {
    date.setHours(Number(value.hour));
  }

  if (value.minute) {
    date.setMinutes(Number(value.minute));
  }

  if (value.second) {
    date.setSeconds(Number(value.second));
  }

  return date;
}

export function TimeInput({ value, onChange, locale, showSeconds = true }: TimeInputProps) {
  const id = useMemo(() => nanoid(), []);
  const [localValue, setLocalValue] = useState<Partial<Record<Part, string>>>();

  const commit = useMemo(
    () =>
      debounce(
        (
          localValue: Partial<Record<Part, string>> = {},
          value: Date | null,
          onChange: (date: Date | null) => void,
        ) => {
          const date = buildTime(localValue, value ?? undefined);
          setLocalValue(undefined);
          onChange(isNaN(date.getTime()) ? null : date);
        },
        100,
      ),
    [],
  );

  const format = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
      }),
    [locale],
  );

  let parts;
  try {
    parts = format.formatToParts(value ?? defaultDate);
  } catch {
    parts = format.formatToParts(defaultDate);
  }

  const isEmpty = !value;

  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'baseline',
      }}
    >
      {parts.map(({ type, value: partValue }, index) => (
        <Fragment key={index}>
          {isIncludedType(type) ? (
            <input
              className={`${className}-${id}`}
              css={{
                boxSizing: 'content-box',
                overflow: 'visible',
                border: 'none',
                borderBottom: '2px solid transparent',
                outline: 'none',
                fontSize: 'inherit',
                backgroundColor: 'inherit',
                color: 'inherit',

                '::placeholder': {
                  color: 'inherit',
                  opacity: 0.5,
                },

                '&:focus': {
                  borderBottom: '2px solid var(--primaryMain)',
                },
              }}
              style={{
                width: `${String(maxValues[type]).length}ch`,
              }}
              placeholder={''.padEnd(String(maxValues[type]).length, '0')}
              value={localValue?.[type] ?? (isEmpty ? '' : partValue)}
              onChange={(event) => {
                const input = event.target.value;
                if (!/^\d*$/.test(input)) return;

                const newValue = { ...localValue, [type]: input };

                if (Number(input) > maxValues[type]) {
                  newValue[type] = String(maxValues[type]);
                }

                setLocalValue(newValue);

                if (input.length >= String(maxValues[type]).length) {
                  setTimeout(() => tabNext(event.target, id));
                }
              }}
              onFocus={(event) => {
                commit.cancel();
                event.target.select();
              }}
              onBlur={() => {
                commit(localValue, value, onChange);
              }}
            />
          ) : type === 'literal' ? (
            <span>{partValue}</span>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
