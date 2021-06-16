import { Id, InternalTableProps } from './types';

export const flatMap = <T, S>(arr: T[], flatMap: (t: T) => S[]): S[] => {
  return arr.reduce<S[]>((out, cur) => out.concat(flatMap(cur)), []);
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

export const intersect = <T>(a: Set<T>, b: Set<T>): Set<T> => {
  const result = new Set<T>();
  for (const x of a) if (b.has(x)) result.add(x);
  return result;
};

export const groupBy = <T, S>(arr: T[], groupBy: (t: T) => S): Map<S, T[]> => {
  const groups = new Map<S, T[]>();

  for (const t of arr) {
    const key = groupBy(t);
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(t);
  }

  return groups;
};

export type TreeNode<T> = { item: T; children: TreeNode<T>[] };
export const buildTree = <T>({ items, id, parentId }: Pick<InternalTableProps<T>, 'items' | 'id' | 'parentId'>): TreeNode<T>[] => {
  if (!parentId) return items.map((item) => ({ item, children: [] }));

  const grouped = groupBy(items, (item) => parentId(item));

  const find = (parentId?: Id): TreeNode<T>[] => {
    return (
      grouped.get(parentId)?.map((item) => ({
        item,
        children: find(id(item)),
      })) ?? []
    );
  };

  return find();
};

export const filterTree = <T>(tree: TreeNode<T>[], filter: (item: T) => boolean): TreeNode<T>[] => {
  return flatMap(tree, ({ item, children }) => {
    const filteredChildren = filterTree(children, filter);
    if (filteredChildren.length || filter(item)) return [{ item, children: filteredChildren }];
    return [];
  });
};

export const flattenTree = <T>(tree: TreeNode<T>[]): T[] => {
  return flatMap(tree, ({ item, children }) => [item, ...flattenTree(children)]);
};

export const getAncestors = <T>(items: T[], Allitems: T[], { id, parentId }: Pick<InternalTableProps<T>, 'id' | 'parentId'>): Set<T> => {
  const result = new Set<T>();
  if (!parentId) return result;

  const lookup = groupBy(Allitems, (item) => id(item)) as Map<Id | undefined, T[]>;

  const find = (item: T): void => {
    const parent = lookup.get(parentId(item))?.[0];
    if (parent && !result.has(parent)) {
      result.add(parent);
      find(parent);
    }
  };
  items.forEach(find);
  return result;
};

export const getDescendants = <T>(items: T[], Allitems: T[], { id, parentId }: Pick<InternalTableProps<T>, 'id' | 'parentId'>): Set<T> => {
  const result = new Set<T>();
  if (!parentId) return result;

  const lookup = groupBy(Allitems, (item) => parentId(item));

  const find = (item: T): void => {
    const children = lookup.get(id(item)) ?? [];
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
