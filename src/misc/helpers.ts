import { Id, TableItem } from '../types';

export const flatMap = <T, S>(arr: Iterable<T>, flatMap: (t: T) => S[]): S[] => {
  return [...arr].reduce<S[]>((out, cur) => out.concat(flatMap(cur)), []);
};

export const orderBy = <T>(arr: T[], selectors: ((t: T) => any)[] = [], direction: ('desc' | 'asc')[] = []): T[] => {
  if (selectors.length === 0) selectors = [(t) => t];

  return [...arr].sort((a, b) => {
    for (let i = 0; i < selectors.length; i++) {
      const _a = selectors[i]?.(a);
      const _b = selectors[i]?.(b);
      const dir = direction[i] === 'desc' ? -1 : 1;
      if (_a > _b) return dir;
      if (_a < _b) return -dir;
    }
    return 0;
  });
};

export const uniq = <T>(arr: T[]): T[] => {
  const set = new Set<T>();
  for (const t of arr) set.add(t);
  return Array.from(set);
};

export const intersect = <T>(a: Iterable<T>, b: { has(t: T): boolean }): Set<T> => {
  const result = new Set<T>();
  for (const x of a) if (b.has(x)) result.add(x);
  return result;
};

export const getAncestors = <T>(activeItemsById: Map<Id, TableItem<T>>, ...items: TableItem<T>[]): Set<Id> => {
  const result = new Set<Id>();

  const find = ({ parentId }: TableItem<T>): void => {
    const parent = parentId ? activeItemsById.get(parentId) : undefined;
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
  if (x instanceof Array) return x.map(asString).join(', ');
  if (x instanceof Object) return JSON.stringify(x);
  return String(x ?? '');
};

export const asStringOrArray = (x: unknown): string | string[] => {
  if (x instanceof Array) return x.map(asString);
  return asString(x);
};

export const defaultEquals = (a: unknown, b: unknown): boolean => a === b;

export const subStringMatch = (a: string, b: string): boolean => a.toLowerCase().includes(b.toLowerCase());

export const castArray = <T>(a: T | T[]) => (a instanceof Array ? a : [a]);

export const cx = (...classNames: (string | false | undefined | null | Record<string, boolean>)[]) =>
  classNames
    .flatMap((entry) => {
      if (!entry) return [];
      if (typeof entry === 'string') return [entry];
      return Object.entries(entry)
        .filter(([, predicate]) => predicate)
        .map(([className]) => className);
    })
    .join(' ');
