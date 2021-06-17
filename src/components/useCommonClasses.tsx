import { makeStyles } from '@material-ui/core';

export const useCommonClasses = makeStyles((theme) => ({
  table: {
    display: 'grid',
  },

  cell: {
    padding: theme.spacing(0.5, 1),
    display: 'grid',
    gridAutoFlow: 'column',
    alignItems: 'center',
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },

  cellFill: {
    borderBottom: `1px solid ${theme.palette.grey[200]}`,
  },

  headerCell: {
    padding: theme.spacing(0.5, 1),
    display: 'grid',
    gridAutoFlow: 'column',
    alignItems: 'center',
    borderBottom: 'none',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    gridTemplateColumns: 'minmax(0, 1fr) max-content',
    background: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',

    '&:not(:first-child)': {
      borderLeft: `1px solid ${theme.palette.background.default}`,
    },
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
