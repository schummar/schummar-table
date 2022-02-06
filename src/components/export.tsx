import React, { useState } from 'react';
import { csvExport, CsvExportOptions } from '../misc/csvExport';
import { useTableContext } from './table';

export function Export<T>(): JSX.Element {
  const [anchor, setAnchor] = useState<Element | null>(null);
  const state = useTableContext<T>();
  const textTitle = state.useState((state) => state.theme.text.exportTitle);
  const textCopy = state.useState((state) => state.theme.text.exportCopy);
  const textDownload = state.useState((state) => state.theme.text.exportDownload);
  const IconButton = state.useState((state) => state.theme.components.IconButton);
  const Button = state.useState((state) => state.theme.components.Button);
  const Popover = state.useState((state) => state.theme.components.Popover);
  const exportIcon = state.useState((state) => state.theme.icons.exportIcon);
  const clipboardIcon = state.useState((state) => state.theme.icons.clipboardIcon);

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
      <IconButton onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}>{exportIcon}</IconButton>

      <Popover open={!!anchor} onClose={() => setAnchor(null)} anchorEl={anchor}>
        <div
          css={{
            padding: `calc(var(--spacing) * 2)`,
            display: 'grid',
            justifyItems: 'stretch',

            '& > *': {
              justifyContent: 'start',
            },
          }}
        >
          <div>{textTitle}</div>
          <Button startIcon={clipboardIcon} onClick={copy}>
            {textCopy}
          </Button>
          <Button startIcon={exportIcon} onClick={download}>
            {textDownload}
          </Button>
        </div>
      </Popover>
    </>
  );
}
