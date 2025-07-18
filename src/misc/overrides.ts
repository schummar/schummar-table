export function overrides<T extends object>(first: T, ...overrides: (Partial<T> | undefined)[]): T {
  return overrides.reduce<T>(
    (result, source) => {
      for (const [key, value] of Object.entries(source ?? {})) {
        if (value !== undefined) {
          result[key as keyof T] = value as any;
        }
      }

      return result;
    },
    { ...first },
  );
}
