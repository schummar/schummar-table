import { Fragment, useMemo, useState } from 'react';

const className = 'schummar-table-date-input';

const defaultDate = new Date(1970, 0, 1);

const isIncludedType = (type: Intl.DateTimeFormatPartTypes): type is 'day' | 'month' | 'year' =>
  type === 'day' || type === 'month' || type === 'year';

const defaultLengths = {
  day: 2,
  month: 2,
  year: 4,
};

const maxLengths = {
  day: 2,
  month: 2,
  year: Number.POSITIVE_INFINITY,
};

const length = (type: 'day' | 'month' | 'year', value: string) =>
  Math.max(value.length, defaultLengths[type]);

const tabNext = (event: Element) => {
  const all = Array.from(document.querySelectorAll(`.${className}`));
  const index = all.indexOf(event);
  const next = all[(index + 1) % all.length];

  if (next instanceof HTMLElement) {
    next.focus();
  }
};

export function DateInput({
  value,
  onChange,
  locale,
}: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  locale?: string;
}) {
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
      case 'day': {
        newValue.setDate(Number(override.value));
        break;
      }

      case 'month': {
        newValue.setMonth(Number(override.value) - 1);
        break;
      }

      case 'year': {
        newValue.setFullYear(Number(override.value));
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
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
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
