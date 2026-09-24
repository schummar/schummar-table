import { css } from '@emotion/react';
import { cx } from '../../misc/helpers';
import type { TableTheme } from '../../types';
import { useLibraryClassName } from '../emotion';

const iconButtonCss = css({
  padding: 'var(--spacing)',
  borderRadius: '50%',
  display: 'inline-flex',
  justifyContent: 'center',
  alignItems: 'center',
  transition: 'background-color 150ms',
  border: 'none',
  cursor: 'pointer',
  color: 'inherit',
  background: 'transparent',

  '&:hover': {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },

  '&:active': {
    transformColor: 'scale3d(0.95, 0.95, 1)',
  },
});

export const IconButton: TableTheme['components']['IconButton'] = ({ className, ...props }) => {
  const libraryClass = useLibraryClassName();
  return <button className={cx(libraryClass(iconButtonCss), className)} {...props} />;
};
