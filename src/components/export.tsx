import { useState } from 'react';
import { useTheme } from '../hooks/useTheme';
import type { CsvExportOptions } from '../misc/csvExport';
import { csvExport } from '../misc/csvExport';
import { useTableContext } from '../misc/tableContext';
import { useCssVariables } from '../theme/useCssVariables';

export function Export<T>(): JSX.Element {
  const table = useTableContext<T>();
  const Button = useTheme((t) => t.components.Button);
  const IconButton = useTheme((t) => t.components.IconButton);
  const Popover = useTheme((t) => t.components.Popover);
  const ExportIcon = useTheme((t) => t.icons.Export);
  const Clipboard = useTheme((t) => t.icons.Clipboard);
  const exportTitle = useTheme((t) => t.text.exportTitle);
  const exportCopy = useTheme((t) => t.text.exportCopy);
  const exportDownload = useTheme((t) => t.text.exportDownload);
  const classes = useTheme((t) => t.classes);
  const cssVariables = useCssVariables();

  const [anchor, setAnchor] = useState<Element | null>(null);

  const generate = (options?: CsvExportOptions) => {
    const { activeColumns, activeItems, items } = table.getState();

    const data = [
      activeColumns.map((column) => String(column.id)),
      ...(options?.all ? items : activeItems).map((item) =>
        activeColumns.map((column) => column.exportCell(column.value(item.value), item.value)),
      ),
    ];
    return csvExport(data, options);
  };

  const copy = () => {
    navigator.clipboard.writeText(generate(table.getState().props.enableExport.copy));
  };

  const download = () => {
    const a = document.createElement('a');
    a.href = `data:text/csv;charset=utf-8,${encodeURIComponent(
      generate(table.getState().props.enableExport.download),
    )}`;
    a.download = 'export.csv';
    document.body.append(a);
    a.click();
    a.remove();
  };

  return (
    <>
      <IconButton onClick={(event) => setAnchor(anchor ? null : event.currentTarget)}>
        <ExportIcon css={!!anchor && { color: 'var(--primaryMain)' }} />
      </IconButton>

      <Popover
        open={!!anchor}
        onClose={() => setAnchor(null)}
        anchorEl={anchor}
        css={cssVariables}
        className={classes?.popover}
        backdropClassName={classes?.popoverBackdrop}
      >
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
          <Button startIcon={<ExportIcon />} onClick={download}>
            {exportDownload}
          </Button>
        </div>
      </Popover>
    </>
  );
}
