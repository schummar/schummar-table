import { createContext, useContext } from 'react';
import type { Store } from 'schummar-state/react';
import type { Id, InternalTableState } from '../types';

export const TableContext = createContext<Store<InternalTableState<any>> | null>(null);

export const TableResetContext = createContext<() => void>(() => undefined);

export const ColumnContext = createContext<Id | null>(null);

export function useTableContext<T>(): Store<InternalTableState<T>> {
  const value = useContext(TableContext);
  if (!value) throw new Error('No table context available');
  return value as Store<InternalTableState<T>>;
}

export function useColumnContext(): Id {
  const value = useContext(ColumnContext);
  if (value === null) throw new Error('No column context available');
  return value;
}
