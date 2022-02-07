import { TableTheme } from '../../types';
import { darkGray, lightGray } from '../defaultClasses';

export const Button: TableTheme['components']['Button'] = ({ startIcon, children, variant, ...props }) => {
  return (
    <button
      css={[
        {
          padding: `var(--spacing) calc(var(--spacing) * 2)`,
          display: 'inline-flex',
          alignItems: 'center',
          transition: 'background-color 150ms',
          border: 'none',
          cursor: 'pointer',
          background: 'transparent',
          borderRadius: 4,

          '&:active:not(:disabled)': {
            transform: 'scale3d(0.95, 0.95, 1)',
          },
        },
        variant !== 'outlined' && {
          '&:hover': {
            background: 'rgba(0, 0, 0, 0.1)',
          },
        },
        variant === 'outlined' && {
          border: `1px solid ${darkGray}`,

          '&:disabled': {
            borderColor: lightGray,
          },
        },
      ]}
      {...props}
    >
      {startIcon && <span css={{ marginRight: `calc(var(--spacing) * 2)` }}>{startIcon}</span>}
      <span>{children}</span>
    </button>
  );
};
