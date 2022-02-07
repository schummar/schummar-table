import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { TableTheme } from '../../types';
import { defaultClasses } from '../defaultClasses';

const MARGIN = 10;
const MAX_OFFSET = 20;

export const Popover: TableTheme['components']['Popover'] = ({ anchorEl, open, onClose, children, className }) => {
  const popper = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number }>();

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
        left: anchorLeft + anchorWidth / 2 - Math.min(popperWidth ? popperWidth / 2 : Infinity, MAX_OFFSET),
        top: anchorBottom,
      };

      if (next.left + popperWidth + MARGIN > viewportWidth) {
        next.left = viewportWidth - popperWidth - MARGIN;
      }
      if (next.top + popperHeight + MARGIN > viewportHeight) {
        next.top = viewportHeight - popperHeight - MARGIN;
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

  return !open || !position
    ? null
    : createPortal(
        <>
          <div
            css={{
              position: 'fixed',
              left: 0,
              right: 0,
              top: 0,
              bottom: 0,
              zIndex: 1000,
            }}
            onClick={() => onClose()}
          />

          <div
            ref={popper}
            className={className}
            css={[
              defaultClasses.card,
              {
                position: 'fixed',
                maxWidth: document.documentElement.clientWidth,
                maxHeight: document.documentElement.clientHeight,
                ...position,
                zIndex: 1001,
              },
            ]}
          >
            {children}
          </div>
        </>,
        document.body,
      );
};
