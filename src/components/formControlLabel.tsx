import { ReactNode } from 'react';

export function FormControlLabel({ control, label }: { control: ReactNode; label: ReactNode }) {
  return (
    <label
      css={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        userSelect: 'none',

        '& > *': {
          cursor: 'pointer',
        },
      }}
    >
      {control}
      <span css={{ marginLeft: 'var(--spacing)' }}>{label}</span>
    </label>
  );
}
