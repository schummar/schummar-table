import { css } from '@emotion/react';
import { CssTheme } from '../types';

const white = '#ffffff';
const lightGray = '#eeeeee';
const gray = '#bdbdbd';

const cell = ({ spacing }: CssTheme) =>
  css({
    padding: `calc(${spacing} * 0.1) ${spacing}`,
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

  headerCell: (theme: CssTheme) =>
    css(cell(theme), {
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
