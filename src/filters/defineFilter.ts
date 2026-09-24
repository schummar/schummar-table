import type { ReactNode } from 'react';
import type { Filter, FilterComponentProps, FilterOptions } from '../types';

export interface FilterDefinition<TInput, TState, TOptions> {
  isActive(value: TState, options: TOptions): boolean;
  /** `input` is the column's `filterBy` value, see `SingleOrMultiple` and `toSingles`. */
  test(value: TState, input: TInput, options: TOptions): boolean;
  /** Delay in ms before changes made in the UI apply, unless the `debounce` option overrides it. */
  debounce?: number;
  Component(props: FilterComponentProps<TInput, TState, TOptions>): ReactNode;
}

/**
 * Creates a filter factory, like `textFilter`. `TInput` is what the filter accepts from a column,
 * typically a `SingleOrMultiple<…>`. A `debounce` option overrides the definition's.
 *
 * The definition's functions are shared by every filter created from it and everything else
 * passed goes into `options`, so a filter created inline on every render stays deep equal and
 * doesn't cause refiltering. Keep options to plain data where possible: functions are compared by
 * reference.
 */
export function defineFilter<TInput, TState, TOptions extends object = {}>(
  definition: FilterDefinition<TInput, TState, TOptions>,
) {
  return (input?: FilterOptions<TState> & TOptions): Filter<TInput, TState, TOptions> => {
    const { defaultValue, external, classNames, ...options } =
      input ?? ({} as FilterOptions<TState>);

    return {
      isActive: definition.isActive,
      test: definition.test,
      debounce: (options as { debounce?: number }).debounce ?? definition.debounce,
      Component: definition.Component,
      defaultValue,
      external,
      classNames,
      options: options as TOptions,
    };
  };
}
