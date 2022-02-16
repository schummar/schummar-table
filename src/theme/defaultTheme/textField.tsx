import { useState } from 'react';
import { TableTheme } from '../../types';
import { darkGray } from '../defaultClasses';

export const TextField: TableTheme['components']['TextField'] = ({ endIcon, className, ...props }) => {
  const [focus, setFocus] = useState(false);

  return (
    <span
      className={className}
      css={[
        {
          display: 'flex',
          border: `1px solid ${darkGray}`,
          borderRadius: 4,
        },
        focus && { border: '2px solid var(--primaryMain)', margin: -1 },
      ]}
    >
      <input
        {...props}
        value={props.value ?? ''}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        css={{
          border: 'none',
          outline: 'none',
          borderRadius: 4,
          padding: 'calc(var(--spacing) * 2)',
          paddingRight: 0,
          transition: 'outline 500ms',
        }}
      />

      {endIcon}
    </span>
  );
};
