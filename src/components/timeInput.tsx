import { Fragment, useMemo, useState } from 'react';

type Part = 'hour' | 'minute' | 'second';

const className = 'schummar-table-time-input';
const defaultDate = new Date(1970, 0, 1);

const isIncludedType = (type: Intl.DateTimeFormatPartTypes): type is Part =>
  type === 'hour' || type === 'minute' || type === 'second';

const defaultLengths = {
  hour: 2,
  minute: 2,
  second: 2,
};

const maxLengths = {
  hour: 2,
  minute: 2,
  second: 2,
};

const length = (type: Part, value: string) => Math.max(value.length, defaultLengths[type]);

const tabNext = (event: Element) => {
  const all = Array.from(document.querySelectorAll(`.${className}`));
  const index = all.indexOf(event);
  const next = all[(index + 1) % all.length];

  if (next instanceof HTMLElement) {
    next.focus();
  }
};

export interface TimeInputProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  locale?: string;
  showSeconds?: boolean;
}

export function TimeInput({ value, onChange, locale, showSeconds = true }: TimeInputProps) {
  const [override, setOverride] = useState<{ type: string; value: string }>();

  const commit = () => {
    if (!override) {
      return;
    }

    setOverride(undefined);

    if (!override.value) {
      onChange(null);
      return;
    }

    const newValue = value ? new Date(value) : new Date();
    switch (override.type) {
      case 'hour': {
        newValue.setHours(Number(override.value));
        break;
      }

      case 'minute': {
        newValue.setMinutes(Number(override.value));
        break;
      }

      case 'second': {
        newValue.setSeconds(Number(override.value));
        break;
      }

      default: {
        break;
      }
    }

    onChange(newValue);
  };

  const format = useMemo(
    () =>
      new Intl.DateTimeFormat(locale, {
        hour: '2-digit',
        minute: '2-digit',
        second: showSeconds ? '2-digit' : undefined,
      }),
    [locale],
  );
  const parts = format.formatToParts(value ?? defaultDate);
  const isEmpty = !value;

  return (
    <div
      css={{
        display: 'flex',
        alignItems: 'baseline',
      }}
    >
      {parts.map(({ type, value }, index) => (
        <Fragment key={index}>
          {isIncludedType(type) ? (
            <input
              className={className}
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
                width: `${length(type, value)}ch`,
              }}
              placeholder={''.padEnd(length(type, value), '0')}
              value={override?.type === type ? override.value : !isEmpty ? value : ''}
              onChange={(event) => {
                setOverride({ type, value: event.target.value });
                if (event.target.value.length >= maxLengths[type]) {
                  setTimeout(() => tabNext(event.target));
                }
              }}
              onFocus={(event) => event.target.select()}
              onBlur={commit}
            />
          ) : type === 'literal' ? (
            <span>{value}</span>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}
