import type { ComponentType } from 'react';
import type { Filter, FilterComponentProps, FilterOptions } from '../types';

export interface FilterDefinition<TFilterBy, TValue, TOptions> {
  isActive: (value: TValue, options: TOptions) => boolean;
  test: (value: TValue, x: TFilterBy, options: TOptions) => boolean;
  /** Used when the filter is created without `filterBy`. By default the column value. */
  filterBy?: (value: any, item: any) => TFilterBy | TFilterBy[];
  /** Delay in ms before changes made in the UI apply. */
  debounce?: number;
  Component: ComponentType<FilterComponentProps<TFilterBy, TValue, TOptions>>;
}

const identity = (x: unknown) => x;

/**
 * The definition's functions are shared by every filter created from it and everything else
 * passed goes into `options`, so a filter created inline on every render stays deep equal and
 * doesn't cause refiltering.
 */
export function createFilter<TItem, TColumnValue, TFilterBy, TValue, TOptions>(
  definition: FilterDefinition<TFilterBy, TValue, TOptions>,
  input: FilterOptions<TItem, TColumnValue, TFilterBy, TValue> & TOptions,
): Filter<TItem, TColumnValue, TFilterBy, TValue, TOptions> {
  const { filterBy, defaultValue, external, persist, classNames, ...options } = input;

  return {
    isActive: definition.isActive,
    test: definition.test,
    filterBy: filterBy ?? definition.filterBy ?? (identity as any),
    debounce: definition.debounce,
    Component: definition.Component,
    defaultValue,
    external,
    persist,
    classNames,
    options: options as TOptions,
  };
}

/**
 * Creates a filter factory, like `textFilter`. Keep `options` to plain data where possible: they
 * are compared deeply, functions by reference.
 */
export function defineFilter<TFilterBy, TValue, TOptions extends object = {}>(
  definition: FilterDefinition<TFilterBy, TValue, TOptions>,
) {
  return <TItem, TColumnValue>(
    options?: FilterOptions<TItem, TColumnValue, TFilterBy, TValue> & TOptions,
  ): Filter<TItem, TColumnValue, TFilterBy, TValue, TOptions> =>
    createFilter(
      definition,
      options ?? ({} as FilterOptions<TItem, TColumnValue, TFilterBy, TValue> & TOptions),
    );
}
