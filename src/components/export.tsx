import { Button, IconButton, makeStyles, Popover, Typography } from '@material-ui/core';
import { AssignmentReturn, CloudDownload, GetApp } from '@material-ui/icons';
import React, { useState } from 'react';
import { csvExport, CsvExportOptions } from '../misc/csvExport';
import { useTableContext } from '../table';

const useClasses = makeStyles((theme) => ({
  dialog: {
    padding: theme.spacing(2),
    display: 'grid',
    justifyItems: 'stretch',

    '& > *': {
      justifyContent: 'start',
    },
  },
}));

export function Export<T>(): JSX.Element {
  const classes = useClasses();
  const [anchor, setAnchor] = useState<HTMLButtonElement | null>(null);
  const state = useTableContext<T>();
  const textTitle = state.useState('props.text.exportTitle');
  const textCopy = state.useState('props.text.exportCopy');
  const textDownload = state.useState('props.text.exportDownload');

  const generate = (options?: CsvExportOptions) => {
    const { activeColumns, activeItems } = state.getState();

    const data = [
      activeColumns.map((column) => String(column.id)),
      ...activeItems.map((item) => activeColumns.map((column) => column.exportCell(column.value(item), item))),
    ];
    return csvExport(data, options);
  };

  const copy = () => {
    navigator.clipboard.writeText(generate(state.getState().props.enableExport.copy));
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(generate(state.getState().props.enableExport.download));
    a.download = 'export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <IconButton color="inherit" onClick={(e) => setAnchor(e.currentTarget)}>
        <GetApp />
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <div className={classes.dialog}>
          <Typography variant="caption">{textTitle ?? 'Export'}</Typography>
          <Button startIcon={<AssignmentReturn />} fullWidth onClick={copy}>
            {textCopy ?? 'In die Zwischenablage'}
          </Button>
          <Button startIcon={<CloudDownload />} fullWidth onClick={download}>
            {textDownload ?? 'Herunterladen'}
          </Button>
        </div>
      </Popover>
    </>
  );
}
