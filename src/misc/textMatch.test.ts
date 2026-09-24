import { describe, expect, test } from 'vite-plus/test';
import { textFilter, type TextFilterOptions } from '../filters/textFilter';
import { termMatch, textMatch } from './textMatch';

function compareWith(compare: TextFilterOptions['compare']) {
  const filter = textFilter({ compare });
  return (itemValue: string, filterValue: string) =>
    filter.test(filterValue, itemValue, filter.options);
}

const substringCompare = compareWith('contains');
const exactCompare = compareWith('exact');
const prefixCompare = compareWith('prefix');

describe('termMatch', () => {
  test('matches when query chars appear in order as a subsequence', () => {
    expect(termMatch('hello world', 'hlo')).toBe(true);
  });

  test('matches exact string', () => {
    expect(termMatch('hello', 'hello')).toBe(true);
  });

  test('does not match when order is violated', () => {
    expect(termMatch('hello', 'oh')).toBe(false);
  });

  test('does not match when a char is missing', () => {
    expect(termMatch('hello', 'hz')).toBe(false);
  });

  test('empty query matches anything, including empty text', () => {
    expect(termMatch('hello', '')).toBe(true);
    expect(termMatch('', '')).toBe(true);
  });

  test('non-empty query never matches empty text', () => {
    expect(termMatch('', 'a')).toBe(false);
  });

  test('is case-sensitive by itself', () => {
    expect(termMatch('ABC', 'a')).toBe(false);
  });
});

describe('textMatch', () => {
  test('is case-insensitive', () => {
    expect(textMatch('Hello World', 'HELLO')).toBe(true);
  });

  test('matches when every whitespace-separated term is a subsequence', () => {
    expect(textMatch('Hello World', 'wor hel')).toBe(true);
  });

  test('fails when any term does not match', () => {
    expect(textMatch('Hello World', 'wor xyz')).toBe(false);
  });

  test('collapses multiple whitespace between terms', () => {
    expect(textMatch('Hello World', 'hel   wor')).toBe(true);
  });

  test('empty query matches anything', () => {
    expect(textMatch('anything', '')).toBe(true);
  });

  test('empty text only matches an empty query', () => {
    expect(textMatch('', '')).toBe(true);
    expect(textMatch('', 'a')).toBe(false);
  });
});

describe('textFilter compare functions', () => {
  test('substringCompare matches case-insensitive substrings', () => {
    expect(substringCompare('Hello World', 'lo wo')).toBe(true);
    expect(substringCompare('Hello World', 'xyz')).toBe(false);
  });

  test('exactCompare requires a full case-insensitive match', () => {
    expect(exactCompare('Hello', 'hello')).toBe(true);
    expect(exactCompare('Hello', 'hell')).toBe(false);
  });

  test('prefixCompare should only match at the start of the string', () => {
    expect(prefixCompare('Hello World', 'World')).toBe(false);
  });

  test('prefixCompare matches an actual prefix', () => {
    expect(prefixCompare('Hello World', 'Hello')).toBe(true);
  });
});
