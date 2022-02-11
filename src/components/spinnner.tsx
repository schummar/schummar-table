import { css } from '@emotion/react';

export function Spinner({ className }: { className?: string }) {
  return (
    <div
      className={className}
      css={css`
        display: inline-block;
        position: relative;
        width: 1em;
        height: 1em;

        div {
          box-sizing: border-box;
          display: block;
          position: absolute;
          width: 0.8em;
          height: 0.8em;
          margin: 0.1em;
          border: 0.1em solid #fff;
          border-radius: 50%;
          animation: lds-ring 1.2s cubic-bezier(0.5, 0, 0.5, 1) infinite;
          border-color: currentColor transparent transparent transparent;
        }
        div:nth-of-type(1) {
          animation-delay: -0.45s;
        }
        div:nth-of-type(2) {
          animation-delay: -0.3s;
        }
        div:nth-of-type(3) {
          animation-delay: -0.15s;
        }
        @keyframes lds-ring {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}
    >
      <div />
      <div />
      <div />
    </div>
  );
}
