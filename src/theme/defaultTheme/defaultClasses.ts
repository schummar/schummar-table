import { css } from '@emotion/react';

const cell = css({
  padding: `calc(var(--spacing) * 0.1) calc(2 * var(--spacing))`,
  display: 'flex',
  alignItems: 'center',
  borderBottom: '1px solid var(--table-border-light-color)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',

  '&:empty': {
    padding: 0,
  },
});

export const defaultClasses = {
  table: css({
    position: 'relative',
    display: 'grid',
    color: 'var(--table-text-color)',
  }),

  cell,

  cellFill: css({
    borderBottom: '1px solid var(--table-border-light-color)',
  }),

  headerCell: css(cell, {
    borderBottom: '1px solid var(--table-border-color)',
    background: 'var(--table-background-color)',

    '&:not(:empty)': {
      padding: `var(--spacing) 0 var(--spacing) calc(2 * var(--spacing))`,
    },
  }),

  footerCell: css(cell, {
    padding: `var(--spacing) calc(2 * var(--spacing))`,
    borderTop: '1px solid var(--table-border-color)',
    borderBottom: 'none',
    background: 'var(--table-background-color)',
  }),

  firstCell: css({
    justifyContent: 'start',
  }),

  sticky: css({
    position: 'sticky',
    top: 0,
    zIndex: 2,
  }),

  stickyBottom: css({
    position: 'sticky',
    bottom: 0,
    zIndex: 2,
  }),

  headerFill: css({
    borderBottom: '1px solid var(--table-border-color)',
    background: 'var(--table-background-color)',
  }),

  footerFill: css({
    borderTop: '1px solid var(--table-border-color)',
    background: 'var(--table-background-color)',
  }),

  text: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),

  card: css({
    borderRadius: 4,
    boxShadow: '0px 3px 14px 2px rgb(0 0 0 / 12%)',
    background: 'var(--table-background-color)',
  }),

  clearFiltersButton: css({
    padding: `0 calc(2 * var(--spacing))`,
    fontWeight: 'bold',
    position: 'sticky',
    left: 0,
    maxWidth: 'fit-content',
    gridColumn: '2/-1',
    button: {
      color: 'var(--primaryMain) !important',
      border: 'solid 1px',
      borderColor: 'var(--primaryMain) !important',
      margin: 'var(--spacing)',
    },
  }),

  details: css(cell, {
    gridColumn: '1 / -1',
    whiteSpace: 'normal',
  }),
};
