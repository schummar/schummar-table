import React, { useState } from 'react';
import { useTheme } from '..';
import { csvExport, CsvExportOptions } from '../misc/csvExport';
import { useCssVariables } from '../theme/useCssVariables';
import { useTableContext } from './table';

export function Export<T>(): JSX.Element {
  const table = useTableContext<T>();
  const {
    components: { Button, IconButton, Popover },
    icons: { Export, Clipboard },
    text,
  } = useTheme();
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);

  const generate = (options?: CsvExportOptions) => {
    const { activeColumns, activeItems } = table.getState();

    const data = [
      activeColumns.map((column) => String(column.id)),
      ...activeItems.map((item) => activeColumns.map((column) => column.exportCell(column.value(item), item))),
    ];
    return csvExport(data, options);
  };

  const copy = () => {
    navigator.clipboard.writeText(generate(table.getState().props.enableExport.copy));
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURIComponent(generate(table.getState().props.enableExport.download));
    a.download = 'export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <>
      <IconButton onClick={(e) => setAnchor(anchor ? null : e.currentTarget)}>
        <Export />
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
          <div css={{ marginBottom: 'var(--spacing)' }}>{text.exportTitle}</div>
          <Button startIcon={<Clipboard />} onClick={copy}>
            {text.exportCopy}
          </Button>
          <Button startIcon={<Export />} onClick={download}>
            {text.exportDownload}
          </Button>
        </div>
      </Popover>
    </>
  );
}
