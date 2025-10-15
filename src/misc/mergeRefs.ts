export default function mergeRefs<T>(...refs: (React.Ref<T> | undefined)[]): React.Ref<T> {
  return (value) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value);
      } else if (ref) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    }
  };
}
