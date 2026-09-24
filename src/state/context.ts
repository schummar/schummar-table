import { createContext, useContext } from 'react';
import type { Id, TableActions, TableContextValue, TableStructure } from '../types';

/** Full table state. Changes on every state change: rows and cells must not consume it. */
export const TableContext = createContext<TableContextValue<any> | null>(null);

/** Header, footer and filter components use this so that row interactions (selection,
 * expansion) don't render them. */
export const TableStructureContext = createContext<TableStructure<any> | null>(null);

/** Stable for the lifetime of the table. */
export const TableActionsContext = createContext<TableActions<any> | null>(null);

/** Only the row checkboxes consume this, so a selection change does not render rows. */
export const SelectionContext = createContext<Set<Id>>(new Set());

export const ColumnContext = createContext<Id | null>(null);

export function useTableContext<T>(): TableContextValue<T> {
  const value = useContext(TableContext);
  if (!value) throw new Error('No table context available');
  return value as TableContextValue<T>;
}

export function useTableStructure<T>(): TableStructure<T> {
  const value = useContext(TableStructureContext);
  if (!value) throw new Error('No table context available');
  return value as TableStructure<T>;
}

export function useTableActions<T>(): TableActions<T> {
  const value = useContext(TableActionsContext);
  if (!value) throw new Error('No table context available');
  return value as TableActions<T>;
}

export function useColumnContext(): Id {
  const value = useContext(ColumnContext);
  if (value === null) throw new Error('No column context available');
  return value;
}
