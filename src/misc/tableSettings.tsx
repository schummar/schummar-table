import { ReactNode, createContext, useContext } from 'react';
import CsvExporter from '../exporters/csvExporter';
import { ExporterEntry } from '../exporters/exporter';
import { PartialTableTheme } from '../types';

export interface TableSettingsContextType {
  theme: PartialTableTheme;
  exporters: ExporterEntry[];
}

export const TableSettingsContext = createContext<TableSettingsContextType>({
  theme: {},
  exporters: [
    { action: 'copy', exporter: new CsvExporter() },
    { action: 'download', exporter: new CsvExporter() },
  ],
});

export function TableSettingsProvider({
  theme,
  exporters,
  additionalExporters,
  children,
}: Partial<TableSettingsContextType> & {
  additionalExporters?: ExporterEntry[];
  children?: ReactNode;
}) {
  const inherited = useContext(TableSettingsContext);
  theme ??= inherited.theme;
  exporters ??= inherited.exporters;

  if (additionalExporters) {
    exporters = [...exporters, ...additionalExporters];
  }

  return (
    <TableSettingsContext.Provider
      value={{
        theme,
        exporters,
      }}
    >
      {children}
    </TableSettingsContext.Provider>
  );
}
