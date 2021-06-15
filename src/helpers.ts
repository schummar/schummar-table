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

export const partition = <T>(arr: T[], predicate: (t: T) => boolean): [yes: T[], no: T[]] => {
  const no: T[] = [];
  const yes = arr.filter((t) => {
    if (predicate(t)) return true;
    no.push(t);
    return false;
  });

  return [yes, no];
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

export const getAncestors = <T>(item: T, items: T[], { id, parentId }: Pick<InternalTableProps<T>, 'id' | 'parentId'>): T[] => {
  if (!parentId) return [];
  const lookup = groupBy(items, (item) => id(item));
  const find = (id?: Id): T[] => flatMap((id ? lookup.get(id) : undefined) ?? [], (item) => [item, ...find(parentId(item))]);
  return find(parentId(item));
};

export const getDescendants = <T>(item: T, items: T[], { id, parentId }: Pick<InternalTableProps<T>, 'id' | 'parentId'>): T[] => {
  if (!parentId) return [];
  const lookup = groupBy(items, (item) => parentId(item));
  const find = (parentId?: Id): T[] => flatMap(lookup.get(parentId) ?? [], (item) => [item, ...find(id(item))]);
  return find(id(item));
};
