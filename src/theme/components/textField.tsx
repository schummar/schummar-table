import { TableTheme } from '../../types';
import { darkGray } from '../defaultClasses';

export const TextField: TableTheme['components']['TextField'] = ({ endIcon, className, ...props }) => {
  return (
    <span
      className={className}
      css={{
        display: 'flex',
        border: `1px solid ${darkGray}`,
        borderRadius: 4,
        paddingLeft: 'var(--spacing)',
      }}
    >
      <input
        {...props}
        value={props.value ?? ''}
        css={{
          border: 'none',
          outline: 'none',
          borderRadius: 4,
        }}
      />

      {endIcon}
    </span>
  );
};
