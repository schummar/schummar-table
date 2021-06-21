import { makeStyles, Theme } from '@material-ui/core';

const cell = (theme: Theme) =>
  ({
    padding: theme.spacing(0.5, 1),
    display: 'grid',
    gridAutoFlow: 'column',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  } as const);

export const useCommonClasses = makeStyles((theme) => ({
  table: {
    position: 'relative',
    display: 'grid',
  },

  cell: cell(theme),

  cellFill: {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },

  headerCell: {
    ...cell(theme),
    borderBottom: 'none',
    gridTemplateColumns: 'minmax(0, 1fr) max-content',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',

    '&:not(:first-child)': {
      borderLeft: `1px solid ${theme.palette.background.default}`,
    },
  },

  firstCell: {
    justifyContent: 'start',
  },

  sticky: {
    position: 'sticky',
    top: 0,
    zIndex: 1,
  },

  headerFill: {
    background: theme.palette.primary.main,
  },

  deferredPlaceholder: {
    padding: theme.spacing(1),
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    gridColumn: '1 / -1',
    display: 'grid',
    justifyContent: 'center',
  },
}));
