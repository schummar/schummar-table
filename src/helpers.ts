import { MultiMap } from './multiMap';
import { Id, WithIds } from './types';

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

export const getAncestors = <T extends WithIds>(activeItemsById: Map<Id, T>, ...items: T[]): Set<T> => {
  const result = new Set<T>();

  const find = (item: T): void => {
    const parent = item.parentId ? activeItemsById.get(item.parentId) : undefined;
    if (parent && !result.has(parent)) {
      result.add(parent);
      find(parent);
    }
  };
  items.forEach(find);
  return result;
};

export const getDescendants = <T extends WithIds>(activeItemsByParentId: MultiMap<Id | undefined, T>, ...items: T[]): Set<T> => {
  const result = new Set<T>();

  const find = (item: T): void => {
    const children = activeItemsByParentId.get(item.id) ?? [];
    for (const child of children) {
      if (!result.has(child)) {
        result.add(child);
        find(child);
      }
    }
  };
  items.forEach(find);
  return result;
};
