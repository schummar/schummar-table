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
  year: Infinity,
};

const length = (type: 'day' | 'month' | 'year', value: string) => Math.max(value.length, defaultLengths[type]);

const tabNext = (e: Element) => {
  const all = Array.from(document.querySelectorAll(`.${className}`));
  const index = all.indexOf(e);
  const next = all[(index + 1) % all.length];

  if (next instanceof HTMLElement) {
    next.focus();
  }
};

export function DateInput({ value, onChange, locale }: { value: Date | null; onChange: (date: Date | null) => void; locale?: string }) {
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
    if (override.type === 'day') {
      newValue.setDate(Number(override.value));
    } else if (override.type === 'month') {
      newValue.setMonth(Number(override.value) - 1);
    } else if (override.type === 'year') {
      newValue.setFullYear(Number(override.value));
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
                width: `${length(type, value)}ch`,
                boxSizing: 'content-box',
                overflow: 'visible',
                border: 'none',
                borderBottom: '2px solid transparent',
                outline: 'none',
                fontSize: 'inherit',

                '&:focus': {
                  borderBottom: '2px solid var(--primaryMain)',
                },
              }}
              placeholder={''.padEnd(length(type, value), '0')}
              value={override?.type === type ? override.value : !isEmpty ? value : ''}
              onChange={(e) => {
                setOverride({ type, value: e.target.value });
                if (e.target.value.length >= maxLengths[type]) {
                  setTimeout(() => tabNext(e.target));
                }
              }}
              onFocus={(e) => e.target.select()}
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
