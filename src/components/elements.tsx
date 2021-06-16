import { styled } from '@material-ui/core';

export const TableView = styled('div')({
  display: 'grid',
});

export const CellView = styled('div')(({ theme }) => ({
  padding: `${theme.spacing(0.5)}px ${theme.spacing()}px`,
  display: 'grid',
  gridAutoFlow: 'column',
  alignItems: 'center',
  borderBottom: `1px solid ${theme.palette.grey[200]}`,
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}));

export const CellFill = styled(CellView)({
  padding: 0,
});

export const HeaderCellView = styled(CellView)(({ theme }) => ({
  gridTemplateColumns: 'minmax(0, 1fr) max-content',
  background: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  fontWeight: 'bold',
  borderBottom: `none`,

  '&:not(:first-child)': {
    borderLeft: `1px solid ${theme.palette.background.default}`,
  },
}));

export const HeaderFill = styled(HeaderCellView)({
  padding: 0,
});

export const DeferredPlaceholder = styled(CellView)(({ theme }) => ({
  gridColumn: '1 / -1',
  padding: theme.spacing(1),
  display: 'grid',
  justifyContent: 'center',
}));
