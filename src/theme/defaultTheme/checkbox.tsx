import { css } from '@emotion/react';
import { cx } from '../../misc/helpers';
import type { TableTheme } from '../../types';
import { useLibraryClassName } from '../emotion';

const labelCss = css({
  padding: 'calc(var(--spacing) * 1.8)',
  display: 'flex',
  color: 'currentcolor',
  userSelect: 'none',

  '& input': {
    appearance: 'none',
    margin: 0,
  },
});

const disabledCss = css({ color: 'rgba(0, 0, 0, 0.26)' });

const iconCss = css({ fontSize: '1.25rem', width: '1em', height: '1em', fill: 'currentColor' });

const checkedIconCss = css({ fill: 'var(--primaryMain)' });

export const Checkbox: TableTheme['components']['Checkbox'] = ({ className, ...props }) => {
  const libraryClass = useLibraryClassName();

  return (
    <label
      className={cx(libraryClass(labelCss), props.disabled && libraryClass(disabledCss), className)}
    >
      <input type="checkbox" {...props} />

      {props.checked ? (
        <svg
          className={libraryClass(iconCss, checkedIconCss)}
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
        </svg>
      ) : (
        <svg
          className={libraryClass(iconCss)}
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 5v14H5V5h14m0-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"></path>
        </svg>
      )}
    </label>
  );
};
