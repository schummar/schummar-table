import { useContext, useState } from 'react';
import { ExportOptions, ExporterEntry } from '../exporters/exporter';
import { useTheme } from '../hooks/useTheme';
import { useTableContext } from '../misc/tableContext';
import { TableSettingsContext } from '../misc/tableSettings';
import { useCssVariables } from '../theme/useCssVariables';

export function Export<T>(): JSX.Element {
  const { exporters: contextExporters } = useContext(TableSettingsContext);
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

  const { all, exporters } = table.useState((state): ExportOptions => {
    if (typeof state.props.enableExport === 'boolean') {
      return {
        all: false,
        exporters: contextExporters,
      };
    }

    return state.props.enableExport;
  });

  const [anchor, setAnchor] = useState<Element | null>(null);

  function execute({ action, exporter }: ExporterEntry) {
    const { activeColumns, activeItems, items } = table.getState();
    const columns = activeColumns.map((column) => column.exportHeader);
    const rows = (all ? items : activeItems).map((item) =>
      activeColumns.map((column) => column.exportCell(column.value(item.value), item.value)),
    );

    if (action === 'copy') {
      const data = exporter.exportToString(columns, rows);
      navigator.clipboard.writeText(data);
    } else {
      const blob = exporter.exportToBlob(columns, rows);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export.${exporter.fileEnding}`;
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    }
  }

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

          {exporters.map((entry, index) => (
            <Button
              key={index}
              startIcon={entry.action === 'copy' ? <Clipboard /> : <ExportIcon />}
              onClick={() => execute(entry)}
            >
              {entry.action === 'copy' ? exportCopy : exportDownload} (.{entry.exporter.type})
            </Button>
          ))}
        </div>
      </Popover>
    </>
  );
}
