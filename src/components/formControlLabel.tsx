import type { ReactNode } from 'react';

export function FormControlLabel({
  control,
  label,
  disabled,
}: {
  control: ReactNode;
  label: ReactNode;
  disabled?: boolean;
}) {
  return (
    <label
      css={[
        {
          display: 'flex',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none',

          '& > *': {
            cursor: 'pointer',
          },
        },
        disabled && { color: 'rgba(0, 0, 0, 0.26)' },
      ]}
    >
      {control}
      <span css={{ marginLeft: 'var(--spacing)' }}>{label}</span>
    </label>
  );
}
