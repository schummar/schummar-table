export function debounce<Args extends any[]>(fn: (...args: Args) => void, ms: number): { (...args: Args): void; flush(): void } {
  let lastArgs: Args | undefined;
  let timeout: ReturnType<typeof setTimeout> | undefined;

  function run() {
    const args = lastArgs;

    lastArgs = undefined;
    timeout = undefined;

    fn(...(args as Args));
  }

  return Object.assign(
    function (...args: Args) {
      lastArgs = args;

      if (timeout) {
        clearTimeout(timeout);
      }

      timeout = setTimeout(run, ms);
    },
    {
      flush() {
        if (timeout) {
          clearTimeout(timeout);
          run();
        }
      },
    },
  );
}
