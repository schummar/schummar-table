import { TableTheme } from '../../types';
import { darkGray, lightGray } from '../defaultClasses';

export const Button: TableTheme['components']['Button'] = ({ startIcon, children, variant = 'text', ...props }) => {
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
        variant === 'text' && {
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
        variant === 'contained' && {
          color: 'var(--primaryContrastColor)',
          backgroundColor: 'var(--primaryColor)',
          boxShadow: '0px 3px 1px -2px rgb(0 0 0 / 20%), 0px 2px 2px 0px rgb(0 0 0 / 14%), 0px 1px 5px 0px rgb(0 0 0 / 12%)',

          '&:hover': {
            filter: 'brightness(0.9)',
          },

          '&:disabled': {
            filter: 'grayscale()',
            opacity: 0.5,
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
