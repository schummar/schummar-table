import { useLayoutEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { throttle } from '../../misc/throttle';
import type { TableTheme } from '../../types';
import { defaultClasses } from './defaultClasses';

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
  const probe = useRef<HTMLDivElement>(null);
  const backdrop = useRef<HTMLDivElement>(null);
  const popper = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function check() {
      const marginLeft = parseFloat(getComputedStyle(popper.current ?? document.body).marginLeft);
      const marginRight = parseFloat(getComputedStyle(popper.current ?? document.body).marginRight);
      const marginTop = parseFloat(getComputedStyle(popper.current ?? document.body).marginTop);
      const marginBottom = parseFloat(
        getComputedStyle(popper.current ?? document.body).marginBottom,
      );
      popper.current?.style.setProperty('--margin-x', `${marginLeft + marginRight}px`);
      popper.current?.style.setProperty('--margin-y', `${marginTop + marginBottom}px`);

      if (hidden) {
        popper.current?.style.setProperty('visibility', 'hidden');
        return;
      }

      const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      const { width: popperWidth = 0, height: popperHeight = 0 } =
        popper.current?.getBoundingClientRect() ?? {};

      const next = {
        left: 0,
        top: 0,
      };

      if (anchorEl) {
        const bb = anchorEl.getBoundingClientRect();

        if (align === 'center') {
          next.left = bb.left + bb.width / 2 - popperWidth / 2;
        } else {
          next.left =
            bb.left -
            Math.min(popperWidth ? popperWidth / 2 : Number.POSITIVE_INFINITY, MAX_OFFSET);
        }

        next.top = bb.bottom;
      } else {
        next.left = (viewportWidth - popperWidth) / 2;
        next.top = (viewportHeight - popperHeight) / 2;
      }

      if (next.left > viewportWidth - popperWidth - marginLeft - marginRight) {
        next.left = viewportWidth - popperWidth - marginLeft - marginRight;
      }
      if (next.left < marginLeft) {
        next.left = marginLeft;
      }
      if (next.top > viewportHeight - popperHeight - marginTop - marginBottom) {
        next.top = viewportHeight - popperHeight - marginTop - marginBottom;
      }
      if (next.top < marginTop) {
        next.top = marginTop;
      }

      popper.current?.style.setProperty('left', `${next.left}px`);
      popper.current?.style.setProperty('top', `${next.top}px`);
      popper.current?.style.setProperty('visibility', 'visible');
    }
    const checkThrottled = throttle(check, 16);
    check();

    const handle = setInterval(checkThrottled, 1000);
    window.addEventListener('resize', checkThrottled);
    window.addEventListener('scroll', checkThrottled, true);

    return () => {
      clearInterval(handle);
      window.removeEventListener('resize', checkThrottled);
      window.removeEventListener('scroll', checkThrottled, true);
    };
  }, [anchorEl, open, hidden, align]);

  useLayoutEffect(() => {
    if (!open) return;

    const ancestors = [];
    for (let node = probe.current?.parentElement; node; node = node.parentElement) {
      ancestors.push(node);
    }

    for (const node of ancestors.reverse()) {
      const value = document.defaultView?.getComputedStyle(node).getPropertyValue('z-index');

      if (value && !Number.isNaN(Number(value))) {
        const newZIndex = Number(value) + 1;

        if (
          backdrop.current &&
          !(
            Number(
              document.defaultView?.getComputedStyle(backdrop.current).getPropertyValue('z-index'),
            ) > newZIndex
          )
        ) {
          backdrop.current?.style.setProperty('z-index', newZIndex.toString());
        }

        if (
          popper.current &&
          !(
            Number(
              document.defaultView?.getComputedStyle(popper.current).getPropertyValue('z-index'),
            ) >
            newZIndex + 1
          )
        ) {
          popper.current?.style.setProperty('z-index', (newZIndex + 1).toString());
        }
        return;
      }
    }
  }, [anchorEl, open]);

  if (!open) return null;

  return (
    <>
      <div
        ref={probe}
        css={{
          display: 'none',
        }}
      />

      {createPortal(
        <>
          <div
            ref={backdrop}
            className={backdropClassName}
            css={[
              {
                position: 'fixed',
                left: 0,
                right: 0,
                top: 0,
                bottom: 0,
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
                width: 'max-content',
                maxWidth: [
                  `calc(100vw - (100vw - 100%) - var(--margin-x))`,
                  `calc(100dvw - (100dvw - 100%) - var(--margin-x))`,
                ],
                maxHeight: [
                  `calc(100vh - (100vh - 100%) - var(--margin-x))`,
                  `calc(100dvh - (100dvh - 100%) - var(--margin-x))`,
                ],
                margin: 10,
                zIndex: 1,
                overflowY: 'auto',
                color: 'var(--table-text-color)',
                visibility: 'hidden',
              },
              hidden && { display: 'none' },
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
