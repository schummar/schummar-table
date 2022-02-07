import { css } from '@emotion/react';

export const white = '#ffffff';
export const lightGray = '#eeeeee';
export const gray = '#bdbdbd';
export const darkGray = '#333';

const cell = css({
  padding: `calc(var(--spacing) * 0.1) var(--spacing)`,
  display: 'flex',
  alignItems: 'center',
  borderBottom: `1px solid ${lightGray}`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  transition: 'transform 300ms',
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
    padding: `var(--spacing)`,
    borderBottom: `2px solid ${gray}`,
    gridTemplateColumns: 'minmax(0, 1fr) max-content',
    background: white,
  }),

  firstCell: css({
    justifyContent: 'start',
  }),

  sticky: css({
    position: 'sticky',
    top: 0,
    zIndex: 1,
  }),

  headerFill: css({
    borderBottom: `2px solid ${gray}`,
    background: white,
  }),

  text: css({
    minWidth: 0,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  }),

  card: css({
    borderRadius: 4,
    boxShadow: '0px 5px 5px -3px rgb(0 0 0 / 20%), 0px 8px 10px 1px rgb(0 0 0 / 14%), 0px 3px 14px 2px rgb(0 0 0 / 12%)',
    background: 'white',
  }),
};
