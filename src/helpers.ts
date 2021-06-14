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
