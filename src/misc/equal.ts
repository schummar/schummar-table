import { isValidElement } from 'react';

const isPlainObject = (x: object) => {
  const prototype = Object.getPrototypeOf(x);
  return prototype === Object.prototype || prototype === null;
};

/**
 * Structural equality for props. Functions and class instances compare by reference: keeping those
 * stable is up to the caller (or the React Compiler). React elements compare by type, key and props.
 */
const handlerTarget = Symbol('eventHandler');

type EventHandler<F> = F & { [handlerTarget]: F };

const isEventHandler = (x: unknown): x is EventHandler<(...args: any[]) => unknown> =>
  typeof x === 'function' && handlerTarget in x;

/**
 * Wraps a callback that `deepEqual` compares like an event handler: any two are equal, so passing a
 * new function on every render doesn't make its object unequal. The previous one, which the
 * caller keeps, then calls the next one's function.
 */
export function eventHandler<F extends (...args: any[]) => unknown>(fn: F): F {
  const handler = ((...args: Parameters<F>) => handler[handlerTarget](...args)) as EventHandler<F>;
  handler[handlerTarget] = fn;
  return handler;
}

/** `a` is the next value, `b` the previous one, see `eventHandler`. */
export function deepEqual(a: unknown, b: unknown, depth = 0): boolean {
  if (Object.is(a, b)) return true;
  if (isEventHandler(a) && isEventHandler(b)) {
    b[handlerTarget] = a[handlerTarget];
    return true;
  }
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  if (depth > 20) return false;

  if (Array.isArray(a)) {
    return (
      Array.isArray(b) &&
      a.length === b.length &&
      a.every((value, index) => deepEqual(value, b[index], depth + 1))
    );
  }

  if (a instanceof Set) {
    if (!(b instanceof Set) || a.size !== b.size) return false;
    for (const value of a) if (!b.has(value)) return false;
    return true;
  }

  if (a instanceof Map) {
    if (!(b instanceof Map) || a.size !== b.size) return false;
    for (const [key, value] of a) {
      if (!b.has(key) || !deepEqual(value, b.get(key), depth + 1)) return false;
    }
    return true;
  }

  if (a instanceof Date) return b instanceof Date && a.getTime() === b.getTime();

  if (isValidElement(a)) {
    return (
      isValidElement(b) &&
      a.type === b.type &&
      a.key === b.key &&
      deepEqual(a.props, b.props, depth + 1)
    );
  }

  if (!isPlainObject(a) || !isPlainObject(b)) return false;

  const keys = Object.keys(a);
  if (keys.length !== Object.keys(b).length) return false;
  return keys.every(
    (key) =>
      key in b &&
      deepEqual(
        (a as Record<string, unknown>)[key],
        (b as Record<string, unknown>)[key],
        depth + 1,
      ),
  );
}

/** Same length and the same elements by reference. For large arrays like `items`. */
export function shallowArrayEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
  return true;
}
