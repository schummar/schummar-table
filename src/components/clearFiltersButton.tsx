import React, { useEffect, useRef } from 'react';
import { defaultClasses } from '../theme/defaultTheme/defaultClasses';
import { useTableContext, useTheme } from '..';

export default function ClearFiltersButton<T>() {
  const Button = useTheme((t) => t.components.Button);
  const textClearFilters = useTheme((t) => t.text.clearFilters);
  const table = useTableContext<T>();
  const rowRef = useRef<HTMLDivElement>(null);

  let scrollLeft: any = null;
  let throttleScrollEventActive = false;

  // TODO: handle window resize
  function handleScrollEvent(event: any, element: any) {
    if (throttleScrollEventActive) return;
    window.requestAnimationFrame(function () {
      const left = element.getBoundingClientRect().left;
      if (scrollLeft != left) {
        scrollLeft = left;
        setVisibleButtonWidth();
      }
      throttleScrollEventActive = false;
    });
    throttleScrollEventActive = true;
  }

  useEffect(() => {
    setVisibleButtonWidth();
    const el = rowRef.current;
    if (!el) return;
    window.addEventListener('scroll', (e) => handleScrollEvent(e, el), true);
    return () => {
      window.removeEventListener('scroll', (e) => handleScrollEvent(e, el), true);
    };
  }, [rowRef.current]);

  function setVisibleButtonWidth() {
    const el = rowRef.current;
    if (!el) return;

    const parent = el.parentElement;
    if (!parent) return;
    const clientWidth = parent.clientWidth;
    const rect = el.getBoundingClientRect();
    const left = rect.left;

    const vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    let width = null;

    if (rect.left < 0 && rect.right < vw) {
      width = rect.right;
    } else if (rect.left < 0 && rect.right > vw) {
      width = vw;
    } else if (left + clientWidth > vw) {
      width = vw - left;
    }

    if (width != null) {
      el.style.maxWidth = `${width}px`;
    }
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
