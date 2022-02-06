import { createPortal } from 'react-dom';
import { CssTheme, TableTheme } from '../types';

const IconButton: TableTheme['components']['IconButton'] = (props) => {
  return (
    <button
      css={{
        padding: 3,
        borderRadius: '50%',
        display: 'inline-flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: 'background-color 150ms',
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',

        '&:hover': {
          background: 'rgba(0, 0, 0, 0.1)',
        },

        '&:active': {
          transform: 'scale3d(0.95, 0.95, 1)',
        },
      }}
      {...props}
    />
  );
};

const Button: TableTheme['components']['Button'] = ({ startIcon, children, ...props }) => {
  return (
    <button
      css={({ spacing }: CssTheme) => ({
        padding: `${spacing} calc(${spacing} * 2)`,
        display: 'inline-flex',
        alignItems: 'center',
        transition: 'background-color 150ms',
        border: 'none',
        cursor: 'pointer',
        background: 'transparent',

        '&:hover': {
          background: 'rgba(0, 0, 0, 0.1)',
        },

        '&:active': {
          transform: 'scale3d(0.95, 0.95, 1)',
        },
      })}
      {...props}
    >
      {startIcon && <span css={({ spacing }: CssTheme) => ({ marginRight: `calc(${spacing} * 2)` })}>{startIcon}</span>}
      <span>{children}</span>
    </button>
  );
};

const Checkbox: TableTheme['components']['Checkbox'] = ({ onChange, ...props }) => {
  return <input type="checkbox" onChange={(e) => onChange(e.target.checked)} {...props} />;
};

const Popover: TableTheme['components']['Popover'] = ({ anchorEl, open, onClose, children }) => {
  if (!open) return null;

  return createPortal(
    <div
      css={{
        position: 'fixed',
        left: anchorEl?.getBoundingClientRect().left,
        top: anchorEl?.getBoundingClientRect().bottom,
        background: 'white',
        border: '1px solid black',
        zIndex: 1,
      }}
    >
      {children}
    </div>,
    document.body,
  );
};

export const defaultComponents: TableTheme['components'] = {
  IconButton,
  Checkbox,
  Popover,
  Button,
};
