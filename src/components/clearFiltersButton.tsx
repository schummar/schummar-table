import React, { useEffect, useRef } from 'react';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useTableContext, useTheme } from '..';

export default function ClearFiltersButton<T>() {
  const Button = useTheme((t) => t.components.Button);
  const textClearFilters = useTheme((t) => t.text.clearFilters);
  const table = useTableContext<T>();

  const rowRef = useRef<HTMLDivElement>(null);

  // TODO: https://stackoverflow.com/questions/33859522/how-much-of-an-element-is-visible-in-viewport

  let scrollLeft: any = null;

  function handleScrollEvent(event: any, element: any) {
    const left = element.getBoundingClientRect().left;

    if (scrollLeft != left) {
      console.log('horizontally scrolled');
      scrollLeft = left;
    }
  }

  useEffect(() => {
    calculateVisibleRowWidth();
    const el = rowRef.current;
    if (!el) return;
    window.addEventListener('scroll', (e) => handleScrollEvent(e, el), true);
    console.log('addedEventListener');

    return () => {
      window.removeEventListener('scroll', (e) => handleScrollEvent(e, el), true);
    };
  }, [rowRef.current]);

  function calculateVisibleRowWidth() {
    const el = rowRef.current;
    if (!el) return;

    const clientWidth = el.parentElement?.clientWidth;
    const left = el.getBoundingClientRect().left;

    if (!clientWidth) {
      return;
    }

    console.log('document.documentElement.clientWidth', document.documentElement.clientWidth);
    console.log('window.innerWidth', window.innerWidth);

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);

    let width = clientWidth;
    if (left + clientWidth > vw) {
      width = vw - left;
    }

    el.style.width = `${width}px`;
  }

  return (
    <div ref={rowRef} css={defaultClasses.clearFiltersButton}>
      <Button
        variant="text"
        onClick={() => {
          table.update((state) => {
            state.activeColumns.forEach((column) => {
              state.filterValues.delete(column.id);
            });
          });
        }}
      >
        {textClearFilters}
      </Button>
    </div>
  );
}
