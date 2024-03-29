export function throttle<Args extends any[]>(
  function_: (...args: Args) => void,
  ms: number,
): { (...args: Args): void; flush(): void; cancel(): void } {
  let last = 0;
  let lastArgs: Args | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function run() {
    const args = lastArgs;

    last = Date.now();
    lastArgs = undefined;
    timeout = undefined;

    function_(...args!);
  }

  return Object.assign(
    function (...args: Args) {
      const now = Date.now();
      lastArgs = args;

      if (timeout) {
        // do nothing
      } else if (now < last + ms) {
        timeout = setTimeout(run, last + ms - now);
      } else {
        run();
      }
    },
    {
      flush() {
        if (lastArgs) {
          run();
        }
      },

      cancel() {
        if (timeout) {
          clearTimeout(timeout);
        }
      },
    },
  );
}
