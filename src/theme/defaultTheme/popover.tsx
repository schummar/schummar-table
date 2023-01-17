import { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TableTheme } from '../../types';
import { defaultClasses } from './defaultClasses';

const MARGIN = 10;
const MAX_OFFSET = 20;

export const Popover: TableTheme['components']['Popover'] = ({
  anchorEl,
  open,
  hidden,
  onClose,
  children,
  className,
  backdropClassName,
  align,
}) => {
  const popper = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>();
  const [zIndex, setZIndex] = useState(1);

  useLayoutEffect(() => {
    if (!anchorEl || !open) {
      setPosition(undefined);
      return;
    }

    let last: { left: number; top: number } | undefined;

    function check() {
      if (!anchorEl) return;
      const { left: anchorLeft, bottom: anchorBottom, width: anchorWidth } = anchorEl.getBoundingClientRect();
      const { width: popperWidth = 0, height: popperHeight = 0 } = popper.current?.getBoundingClientRect() ?? {};
      const viewportWidth = document.documentElement.clientWidth;
      const viewportHeight = document.documentElement.clientHeight;

      const next = {
        left:
          align === 'center'
            ? anchorLeft + anchorWidth / 2 - popperWidth / 2
            : anchorLeft - Math.min(popperWidth ? popperWidth / 2 : Infinity, MAX_OFFSET),
        top: anchorBottom,
      };

      if (next.left < MARGIN) {
        next.left = MARGIN;
      }
      if (next.left + popperWidth > viewportWidth - MARGIN) {
        next.left = viewportWidth - MARGIN - popperWidth;
      }
      if (next.top < MARGIN) {
        next.top = MARGIN;
      }
      if (next.top + popperHeight > viewportHeight - MARGIN) {
        next.top = viewportHeight - MARGIN - popperHeight;
      }

      if (next.left !== last?.left || next.top !== last?.top) {
        setPosition(next);
      }

      last = next;
    }
    check();

    const handle = setInterval(check, 16);
    return () => {
      clearInterval(handle);
    };
  }, [anchorEl, open]);

  function updateZIndex(div: HTMLDivElement | null) {
    const ancestors = [];
    for (let node = div?.parentElement; node; node = node.parentElement) {
      ancestors.push(node);
    }

    for (const node of ancestors.reverse()) {
      const value = document.defaultView?.getComputedStyle(node).getPropertyValue('z-index');

      if (value && !isNaN(Number(value))) {
        setZIndex(Number(value) + 1);
        return;
      }
    }
  }

  if (!open) return null;

  return (
    <>
      <div
        ref={updateZIndex}
        css={{
          display: 'none',
        }}
      />

      {createPortal(
        <>
          <div
            className={backdropClassName}
            css={[
              {
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
                zIndex,
              },
              hidden && { display: 'none' },
            ]}
            onClick={() => onClose()}
          />

          <div
            ref={popper}
            className={className}
            css={[
              defaultClasses.card,
              {
                position: 'fixed',
                maxWidth: document.documentElement.clientWidth - 2 * MARGIN,
                maxHeight: document.documentElement.clientHeight - 2 * MARGIN,
                ...position,
                zIndex: zIndex + 1,
                overflowY: 'auto',
              },
              hidden && { display: 'none' },
              !position && { visibility: 'hidden' },
            ]}
          >
            {children}
          </div>
        </>,
        document.body,
      )}
    </>
  );
};
