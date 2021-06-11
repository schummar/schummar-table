export const flatMap = <T, S>(arr: T[], flatMap: (t: T) => S[]): S[] => {
  return arr.reduce<S[]>((out, cur) => out.concat(flatMap(cur)), []);
};

export const groupBy = <T>(arr: T[], groupBy: (t: T) => unknown): T[][] => {
  const groups = new Map<any, T[]>();
  for (const t of arr) {
    const key = groupBy(t);
    let group = groups.get(key);
    if (!group) {
      group = [];
      groups.set(key, group);
    }
    group.push(t);
  }

  return [...groups.values()];
};

export const orderBy = <T, S>(arr: T[], selectors: ((t: T) => any)[] = [], direction: ('desc' | 'asc')[] = []): T[] => {
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

export const uniq = <T, S>(arr: T[]): T[] => {
  const set = new Set<T>();
  for (const t of arr) set.add(t);
  return [...set.values()];
};
