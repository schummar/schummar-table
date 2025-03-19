export function defaultSerializer(x: unknown): string | number | Date {
  if (x instanceof Date || typeof x === 'number' || typeof x === 'string') {
    return x;
  }

  return JSON.stringify(x) ?? '';
}
