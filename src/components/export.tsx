import React, { useState } from 'react';
import { csvExport, CsvExportOptions } from '../misc/csvExport';
import { useCssVariables } from '../theme/useCssVariables';
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
  const ExportIcon = state.useState((state) => state.theme.icons.Export);
  const ClipboardIcon = state.useState((state) => state.theme.icons.Clipboard);
  const cssVariables = useCssVariables();

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
      <IconButton onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}>
        <ExportIcon />
      </IconButton>

      <Popover open={!!anchor} onClose={() => setAnchor(null)} anchorEl={anchor} css={cssVariables}>
        <div
          css={{
            padding: `calc(var(--spacing) * 2)`,
            display: 'grid',
            justifyItems: 'stretch',
            gap: 'var(--spacing)',

            '& > *': {
              justifyContent: 'start',
            },
          }}
        >
          <div css={{ marginBottom: 'var(--spacing)' }}>{textTitle}</div>
          <Button startIcon={<ClipboardIcon />} onClick={copy}>
            {textCopy}
          </Button>
          <Button startIcon={<ExportIcon />} onClick={download}>
            {textDownload}
          </Button>
        </div>
      </Popover>
    </>
  );
}
