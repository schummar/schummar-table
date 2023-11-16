export function defaults<T extends object>(first: T, ...more: Partial<T>[]): T {
  return more.reduce<T>((acc, source) => {
    const copy = { ...acc };

    for (const [key, value] of Object.entries(source)) {
      copy[key as keyof T] ??= value as any;
    }

    return copy;
  }, first);
}
