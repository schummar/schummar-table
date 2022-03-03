import { TableTheme } from '../../types';

export const Checkbox: TableTheme['components']['Checkbox'] = (props) => {
  return (
    <label
      css={[
        {
          padding: 'calc(var(--spacing) * 1.8)',
          display: 'flex',
          color: 'currentcolor',

          '& input': {
            appearance: 'none',
            margin: 0,
          },
        },
        props.disabled && { color: 'rgba(0, 0, 0, 0.26)' },
      ]}
    >
      <input type="checkbox" {...props} />

      {props.checked ? (
        <svg
          css={{ fontSize: '1.25rem', width: '1em', height: '1em', fill: 'var(--primaryMain)' }}
          focusable="false"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path d="M19 3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.11 0 2-.9 2-2V5c0-1.1-.89-2-2-2zm-9 14l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"></path>
        </svg>
      ) : (
        <svg
          css={{ fontSize: '1.25rem', width: '1em', height: '1em', fill: 'currentColor' }}
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
