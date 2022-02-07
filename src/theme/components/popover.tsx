import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { TableTheme } from '../../types';
import { defaultClasses } from '../defaultClasses';

export const Popover: TableTheme['components']['Popover'] = ({ anchorEl, open, onClose, ...props }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function click(e: MouseEvent) {
      const inside = e.target instanceof Node && (ref.current?.contains(e.target) || anchorEl?.contains(e.target));

      if (!inside) {
        onClose();
      }
    }

    document.addEventListener('click', click, true);

    return () => {
      document.removeEventListener('click', click, true);
    };
  }, [open, ref.current, anchorEl, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      {...props}
      ref={ref}
      css={[
        defaultClasses.card,
        {
          position: 'fixed',
          left: anchorEl?.getBoundingClientRect().left,
          top: anchorEl?.getBoundingClientRect().bottom,
          zIndex: 1,
        },
      ]}
    />,
    document.body,
  );
};
