import { useCallback, useRef, useState } from 'react';
import type { TableProps } from '../types';

/** Resetting remounts the table state under a new key and reports the defaults. */
export function useTableReset<T>(props: TableProps<T>) {
  const [resetKey, setResetKey] = useState(0);
  const latestProps = useRef(props);
  latestProps.current = props;

  const onReset = useCallback(() => {
    const props = latestProps.current;
    setResetKey((key) => key + 1);

    if (props.sort === undefined) props.onSortChange?.(props.defaultSort ?? []);
    if (props.expanded === undefined) props.onExpandedChange?.(props.defaultExpanded ?? new Set());
    if (props.selection === undefined) {
      props.onSelectionChange?.(props.defaultSelection ?? new Set());
    }
    if (props.hiddenColumns === undefined) {
      props.onHiddenColumnsChange?.(props.defaultHiddenColumns ?? new Set());
    }
    props.onReset?.('table');
  }, []);

  return [resetKey, onReset] as const;
}
