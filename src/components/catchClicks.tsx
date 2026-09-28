import { css } from '@emotion/react';
import type React from 'react';
import { useLibraryClassName } from '../theme/emotion';

const wrapperCss = css({ display: 'contents' });

/** Rows may be wrapped in links. Theme checkboxes only guarantee that clicks on the input itself
 * toggle; a click on their padding would reach the link instead. */
export function CatchClicks({
  onToggle,
  children,
}: {
  onToggle: (event: React.MouseEvent) => void;
  children: React.ReactNode;
}) {
  const libraryClass = useLibraryClassName();

  return (
    <span
      className={libraryClass(wrapperCss)}
      onClick={(event) => {
        event.stopPropagation();
        if (!(event.target instanceof HTMLInputElement)) {
          event.preventDefault();
          onToggle(event);
        }
      }}
    >
      {children}
    </span>
  );
}
