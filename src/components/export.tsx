import React, { useState } from 'react';
import { useTheme } from '..';
import { csvExport, CsvExportOptions } from '../misc/csvExport';
import { useCssVariables } from '../theme/useCssVariables';
import { useTableContext } from './table';

export function Export<T>(): JSX.Element {
  const table = useTableContext<T>();
  const Button = useTheme((t) => t.components.Button);
  const IconButton = useTheme((t) => t.components.IconButton);
  const Popover = useTheme((t) => t.components.Popover);
  const Export = useTheme((t) => t.icons.Export);
  const Clipboard = useTheme((t) => t.icons.Clipboard);
  const exportTitle = useTheme((t) => t.text.exportTitle);
  const exportCopy = useTheme((t) => t.text.exportCopy);
  const exportDownload = useTheme((t) => t.text.exportDownload);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);

  const generate = (options?: CsvExportOptions) => {
    const { activeColumns, activeItems } = table.getState();

    const data = [
      activeColumns.map((column) => String(column.id)),
      ...activeItems.map((item) => activeColumns.map((column) => column.exportCell(column.value(item.value), item.value))),
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
        <Export css={!!anchor && { color: 'var(--primaryMain)' }} />
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
          <div css={{ marginBottom: 'var(--spacing)' }}>{exportTitle}</div>
          <Button startIcon={<Clipboard />} onClick={copy}>
            {exportCopy}
          </Button>
          <Button startIcon={<Export />} onClick={download}>
            {exportDownload}
          </Button>
        </div>
      </Popover>
    </>
  );
}
