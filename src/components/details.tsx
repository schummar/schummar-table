import { forwardRef } from 'react';
import { useTheme } from '../hooks/useTheme';
import { useTableContext } from '../misc/tableContext';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { Id } from '../types';

export const Details = forwardRef<
  HTMLDivElement,
  {
    itemId: Id;
    rowIndex: number;
  }
>(function Details({ itemId, rowIndex }, ref) {
  const table = useTableContext<unknown>();
  const classes = useTheme((t) => t.classes);
  const styles = useTheme((t) => t.styles);

  const { details, className, css } = table.useState((state) => {
    const item = state.activeItemsById.get(itemId);

    return {
      details: state.expanded.has(itemId)
        ? state.props.rowDetails instanceof Function
          ? item
            ? state.props.rowDetails(item.value, rowIndex)
            : null
          : state.props.rowDetails
        : undefined,
      className:
        classes?.details instanceof Function
          ? classes.details(item?.value, rowIndex)
          : classes?.details,
      css:
        styles?.details instanceof Function
          ? styles.details(item?.value, rowIndex)
          : styles?.details,
    };
  });

  return details ? (
    <div ref={ref} className={className} css={[defaultClasses.details, css]}>
      {details}
    </div>
  ) : null;
});
