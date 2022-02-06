import { css } from '@emotion/react';

const white = '#ffffff';
const lightGray = '#eeeeee';
const gray = '#bdbdbd';

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
};
