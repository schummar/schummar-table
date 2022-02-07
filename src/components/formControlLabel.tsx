import { ReactNode } from 'react';

export function FormControlLabel({ control, label }: { control: ReactNode; label: ReactNode }) {
  return (
    <label css={{ cursor: 'pointer', '& > *': { cursor: 'pointer' } }}>
      {control}
      <span css={{ marginLeft: 'var(--spacing)' }}>{label}</span>
    </label>
  );
}
