import { Id, WithIds } from '../types';
import { MultiMap } from './multiMap';

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
  return [...set.values()];
};

export const intersect = <T>(a: Iterable<T>, b: { has(t: T): boolean }): Set<T> => {
  const result = new Set<T>();
  for (const x of a) if (b.has(x)) result.add(x);
  return result;
};

export const filterTree = <T extends WithIds>(
  tree: MultiMap<Id | undefined, T>,
  filter: (item: T) => boolean,
): MultiMap<Id | undefined, T> => {
  const result = new MultiMap<Id | undefined, T>();

  const traverse = (parentId?: Id): T[] =>
    flatMap(tree.get(parentId) ?? [], (item) => {
      const children = traverse(item.id);
      if (children.length > 0 || filter(item)) {
        return [item, ...children];
      }
      return [];
    });

  for (const item of traverse()) {
    result.set(item.parentId, item);
  }

  return result;
};

export const flattenTree = <T extends WithIds>(tree: MultiMap<Id | undefined, T>): T[] => {
  const traverse = (parentId?: Id): T[] => {
    return flatMap([...(tree.get(parentId) ?? [])], (item) => [item, ...traverse(item.id)]);
  };
  return traverse(undefined);
};

export const getAncestors = <T extends WithIds>(activeItemsById: Map<Id, T>, ...itemIds: Id[]): Set<Id> => {
  const result = new Set<Id>();

  const find = (itemId: Id): void => {
    const parentId = activeItemsById.get(itemId)?.parentId;
    const parent = parentId ? activeItemsById.get(parentId) : undefined;
    if (parent && !result.has(parent.id)) {
      result.add(parent.id);
      find(parent.id);
    }
  };
  itemIds.forEach(find);
  return result;
};

export const getDescendants = <T extends WithIds>(activeItemsByParentId: MultiMap<Id | undefined, T>, ...itemIds: Id[]): Set<Id> => {
  const result = new Set<Id>();

  const find = (itemId: Id): void => {
    const children = activeItemsByParentId.get(itemId) ?? [];
    for (const child of children) {
      if (!result.has(child.id)) {
        result.add(child.id);
        find(child.id);
      }
    }
  };
  itemIds.forEach(find);
  return result;
};

export const c = (...classNames: (string | Record<string, boolean> | undefined)[]): string =>
  flatMap(classNames, (item) => {
    if (item === undefined) return [];
    if (typeof item === 'string') return [item];
    return Object.entries(item)
      .filter(([, predicate]) => predicate)
      .map(([key]) => key);
  }).join(' ');

export const clamp = (min: number, max: number, n: number): number => {
  if (n < min) return min;
  if (n > max) return max;
  return n;
};
