import { css } from '@emotion/react';

export const white = '#ffffff';
export const lightGray = '#eeeeee';
export const gray = '#bdbdbd';
export const darkGray = '#777';

const cell = css({
  padding: `calc(var(--spacing) * 0.1) calc(2 * var(--spacing))`,
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid #dfe2e9`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  background: 'white',
});

export const defaultClasses = {
  table: css({
    position: 'relative',
    display: 'grid',
  }),

  cell,

  cellFill: css({
    borderBottom: `1px solid ${lightGray}`,
  }),

  headerCell: css(cell, {
    padding: `var(--spacing) 0 var(--spacing) calc(2 * var(--spacing))`,
    borderBottom: `1px solid #c9cfda`,
  }),

  footerCell: css(cell, {
    padding: `var(--spacing) calc(2 * var(--spacing))`,
    borderTop: `1px solid #c9cfda`,
    borderBottom: 'none',
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
    borderBottom: `1px solid #c9cfda`,
    background: white,
  }),

  footerFill: css({
    borderTop: `1px solid #c9cfda`,
    background: white,
  }),

  text: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),

  card: css({
    borderRadius: 4,
    boxShadow: '0px 3px 14px 2px rgb(0 0 0 / 12%)',
    background: 'white',
  }),
};
