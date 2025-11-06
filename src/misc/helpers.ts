import type { Id, TableItem } from '../types';

export const flatMap = <T, S>(array: Iterable<T>, flatMap: (t: T) => S[]): S[] => {
  return [...array].flatMap(flatMap);
};

export const orderBy = <T>(
  array: T[],
  selectors: ((t: T) => any)[] = [],
  direction: ('desc' | 'asc')[] = [],
  locale?: (string | undefined)[],
  options?: (Intl.CollatorOptions | undefined)[],
): T[] => {
  if (selectors.length === 0) selectors = [(t) => t];

  return [...array].sort((a, b) => {
    for (let i = 0; i < selectors.length; i++) {
      const _a = selectors[i]?.(a);
      const _b = selectors[i]?.(b);
      const _direction = direction[i] === 'desc' ? -1 : 1;
      const _locale = locale?.[i];
      const _options = options?.[i];

      if (typeof _a === 'string' && typeof _b === 'string') {
        return _a.localeCompare(_b, _locale, _options) * _direction;
      }

      if (_a > _b) return _direction;
      if (_a < _b) return -_direction;
    }
    return 0;
  });
};

export const uniq = <T>(array: T[]): T[] => {
  const set = new Set<T>();
  for (const t of array) set.add(t);
  return Array.from(set);
};

export const intersect = <T>(a: Iterable<T>, b: { has(t: T): boolean }): Set<T> => {
  const result = new Set<T>();
  for (const x of a) if (b.has(x)) result.add(x);
  return result;
};

export const getAncestors = <T>(
  activeItemsById: Map<Id, TableItem<T>>,
  ...items: TableItem<T>[]
): Set<Id> => {
  const result = new Set<Id>();

  const find = ({ parentId }: TableItem<T>): void => {
    const parent =
      parentId !== undefined && parentId !== null ? activeItemsById.get(parentId) : undefined;
    if (parent && !result.has(parent.id)) {
      result.add(parent.id);
      find(parent);
    }
  };
  items.forEach(find);
  return result;
};

export const getDescendants = <T>(...items: TableItem<T>[]): Set<Id> => {
  const result = new Set<Id>();

  const find = (item: TableItem<T>): void => {
    for (const child of item.children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        find(child);
      }
    }
  };
  items.forEach(find);
  return result;
};

export const identity = (x: unknown): any => x;

export const asString = (x: unknown): string => {
  if (Array.isArray(x)) return x.map(asString).join(', ');
  if (x instanceof Object) return JSON.stringify(x);
  return String(x ?? '');
};

export const asStringOrArray = (x: unknown): string | string[] => {
  if (Array.isArray(x)) return x.map(asString);
  return asString(x);
};

export const asNumber = (x: unknown): number | null => {
  const n = Number(x);
  return Number.isNaN(n) ? null : n;
};

export const asNumberOrArray = (x: unknown): number | null | (number | null)[] => {
  if (Array.isArray(x)) return x.map(asNumber);
  return asNumber(x);
};

export const defaultEquals = (a: unknown, b: unknown): boolean => a === b;

export const subStringMatch = (a: string, b: string): boolean =>
  a.toLowerCase().includes(b.toLowerCase());

export const castArray = <T>(a: T | T[]) => (Array.isArray(a) ? a : [a]);

export const cx = (
  ...classNames: (string | false | undefined | null | Record<string, boolean>)[]
) =>
  classNames
    .flatMap((entry) => {
      if (!entry) return [];
      if (typeof entry === 'string') return [entry];
      return Object.entries(entry)
        .filter(([, predicate]) => predicate)
        .map(([className]) => className);
    })
    .join(' ');

type Falsy = false | 0 | '' | null | undefined;
export function isTruthy<T>(x: T): x is Exclude<T, Falsy> {
  return !!x;
}
