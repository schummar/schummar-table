import { describe, expect, test } from 'vite-plus/test';
import type { TableItem } from '../types';
import {
  asNumber,
  asNumberOrArray,
  asString,
  asStringOrArray,
  castArray,
  cx,
  defaultEquals,
  flatMap,
  getAncestors,
  getDescendants,
  identity,
  intersect,
  isTruthy,
  orderBy,
  subStringMatch,
  uniq,
} from './helpers';

function item<T>(id: string, value: T, parentId?: string | null): TableItem<T> {
  return { id, parentId, children: [], depth: 0, value };
}

describe('flatMap', () => {
  test('flattens the mapped results', () => {
    expect(flatMap([1, 2, 3], (n) => [n, n])).toEqual([1, 1, 2, 2, 3, 3]);
  });

  test('works with an iterable that is not an array', () => {
    expect(flatMap(new Set([1, 2]), (n) => [n * 2])).toEqual([2, 4]);
  });

  test('empty input yields empty output', () => {
    expect(flatMap([], (n: number) => [n])).toEqual([]);
  });
});

describe('orderBy', () => {
  test('sorts ascending by default', () => {
    expect(orderBy([3, 1, 2])).toEqual([1, 2, 3]);
  });

  test('sorts by a selector', () => {
    const items = [{ n: 3 }, { n: 1 }, { n: 2 }];
    expect(orderBy(items, [(x) => x.n])).toEqual([{ n: 1 }, { n: 2 }, { n: 3 }]);
  });

  test('sorts descending', () => {
    expect(orderBy([1, 2, 3], [(x) => x], ['desc'])).toEqual([3, 2, 1]);
  });

  test('sorts strings using localeCompare', () => {
    expect(orderBy(['b', 'a', 'c'], [(x) => x])).toEqual(['a', 'b', 'c']);
  });

  test('supports multiple selectors for tie-breaking', () => {
    const items = [
      { a: 1, b: 2 },
      { a: 1, b: 1 },
      { a: 0, b: 5 },
    ];
    expect(orderBy(items, [(x) => x.a, (x) => x.b])).toEqual([
      { a: 0, b: 5 },
      { a: 1, b: 1 },
      { a: 1, b: 2 },
    ]);
  });

  test('falls through to the next selector on equal strings', () => {
    const items = [
      { a: 'x', b: 2 },
      { a: 'x', b: 1 },
      { a: 'w', b: 5 },
    ];
    expect(orderBy(items, [(x) => x.a, (x) => x.b])).toEqual([
      { a: 'w', b: 5 },
      { a: 'x', b: 1 },
      { a: 'x', b: 2 },
    ]);
  });

  test('does not mutate the input array', () => {
    const input = [3, 1, 2];
    orderBy(input);
    expect(input).toEqual([3, 1, 2]);
  });

  test('empty array returns empty array', () => {
    expect(orderBy([])).toEqual([]);
  });
});

describe('uniq', () => {
  test('removes duplicates while preserving order', () => {
    expect(uniq([1, 2, 1, 3, 2])).toEqual([1, 2, 3]);
  });

  test('empty input yields empty output', () => {
    expect(uniq([])).toEqual([]);
  });
});

describe('intersect', () => {
  test('returns elements present in both', () => {
    expect(intersect([1, 2, 3], new Set([2, 3, 4]))).toEqual(new Set([2, 3]));
  });

  test('empty when there is no overlap', () => {
    expect(intersect([1, 2], new Set([3, 4]))).toEqual(new Set());
  });
});

describe('getAncestors', () => {
  test('collects all ancestor ids up the tree', () => {
    const grandparent = item('gp', 'gp', null);
    const parent = item('p', 'p', 'gp');
    const child = item('c', 'c', 'p');
    const byId = new Map([
      ['gp', grandparent],
      ['p', parent],
      ['c', child],
    ]);
    expect(getAncestors(byId, child)).toEqual(new Set(['p', 'gp']));
  });

  test('a root item has no ancestors', () => {
    const root = item('root', 'root', null);
    const byId = new Map([['root', root]]);
    expect(getAncestors(byId, root)).toEqual(new Set());
  });

  test('merges ancestors across multiple items', () => {
    const parentA = item('pa', 'pa', null);
    const childA = item('ca', 'ca', 'pa');
    const parentB = item('pb', 'pb', null);
    const childB = item('cb', 'cb', 'pb');
    const byId = new Map([
      ['pa', parentA],
      ['ca', childA],
      ['pb', parentB],
      ['cb', childB],
    ]);
    expect(getAncestors(byId, childA, childB)).toEqual(new Set(['pa', 'pb']));
  });

  test('stops gracefully when a parentId is not in the map', () => {
    const orphan = item('o', 'o', 'missing');
    const byId = new Map([['o', orphan]]);
    expect(getAncestors(byId, orphan)).toEqual(new Set());
  });
});

describe('getDescendants', () => {
  test('collects all descendant ids down the tree', () => {
    const grandchild = item('gc', 'gc');
    const child = { ...item('c', 'c'), children: [grandchild] };
    const root = { ...item('r', 'r'), children: [child] };
    expect(getDescendants(root)).toEqual(new Set(['c', 'gc']));
  });

  test('a leaf item has no descendants', () => {
    const leaf = item('l', 'l');
    expect(getDescendants(leaf)).toEqual(new Set());
  });
});

describe('identity', () => {
  test('returns its argument unchanged', () => {
    const obj = { a: 1 };
    expect(identity(obj)).toBe(obj);
  });
});

describe('asString', () => {
  test('stringifies primitives', () => {
    expect(asString(1)).toBe('1');
    expect(asString('x')).toBe('x');
    expect(asString(true)).toBe('true');
  });

  test('treats null and undefined as an empty string', () => {
    expect(asString(null)).toBe('');
    expect(asString(undefined)).toBe('');
  });

  test('joins array elements with a comma', () => {
    expect(asString([1, 'a', null])).toBe('1, a, ');
  });

  test('JSON-stringifies plain objects', () => {
    expect(asString({ a: 1 })).toBe('{"a":1}');
  });
});

describe('asStringOrArray', () => {
  test('maps arrays element-wise', () => {
    expect(asStringOrArray([1, 2])).toEqual(['1', '2']);
  });

  test('stringifies non-array values', () => {
    expect(asStringOrArray(5)).toBe('5');
  });
});

describe('asNumber', () => {
  test('parses numeric strings', () => {
    expect(asNumber('42')).toBe(42);
  });

  test('returns null for non-numeric input', () => {
    expect(asNumber('abc')).toBeNull();
  });

  test('empty string coerces to 0', () => {
    expect(asNumber('')).toBe(0);
  });
});

describe('asNumberOrArray', () => {
  test('maps arrays element-wise', () => {
    expect(asNumberOrArray(['1', 'x', '3'])).toEqual([1, null, 3]);
  });

  test('parses non-array values', () => {
    expect(asNumberOrArray('7')).toBe(7);
  });
});

describe('defaultEquals', () => {
  test('uses strict equality', () => {
    expect(defaultEquals(1, 1)).toBe(true);
    expect(defaultEquals(1, '1')).toBe(false);
    const obj = {};
    expect(defaultEquals(obj, obj)).toBe(true);
    expect(defaultEquals({}, {})).toBe(false);
  });
});

describe('subStringMatch', () => {
  test('is a case-insensitive substring check', () => {
    expect(subStringMatch('Hello World', 'lo wo')).toBe(true);
    expect(subStringMatch('Hello World', 'xyz')).toBe(false);
  });
});

describe('castArray', () => {
  test('wraps a non-array value', () => {
    expect(castArray(1)).toEqual([1]);
  });

  test('leaves an array unchanged', () => {
    expect(castArray([1, 2])).toEqual([1, 2]);
  });
});

describe('cx', () => {
  test('joins truthy string class names', () => {
    expect(cx('a', 'b')).toBe('a b');
  });

  test('drops falsy entries', () => {
    expect(cx('a', false, undefined, null, '')).toBe('a');
  });

  test('expands a record of class name to predicate', () => {
    expect(cx({ a: true, b: false, c: true })).toBe('a c');
  });

  test('mixes strings and records', () => {
    expect(cx('a', { b: true })).toBe('a b');
  });
});

describe('isTruthy', () => {
  test('filters out falsy values from an array', () => {
    expect([1, 0, 'a', '', null, undefined, false].filter(isTruthy)).toEqual([1, 'a']);
  });
});
