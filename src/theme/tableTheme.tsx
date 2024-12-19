import { Store } from 'schummar-state/react';
import type { PartialTableTheme } from '../types';

export const globalTableTheme = new Store<PartialTableTheme>({});

export function configureTableTheme(tableTheme: PartialTableTheme) {
  globalTableTheme.set(tableTheme);
}

export function mergeThemes<T>(...themes: PartialTableTheme<T>[]): PartialTableTheme<T> {
  return {
    text: Object.assign({}, ...themes.map((theme) => theme.text)),
    classes: Object.assign({}, ...themes.map((theme) => theme.classes)),
    styles: Object.assign({}, ...themes.map((theme) => theme.styles)),
    components: Object.assign({}, ...themes.map((theme) => theme.components)),
    icons: Object.assign({}, ...themes.map((theme) => theme.icons)),
    colors: {
      primary: Object.assign({}, ...themes.map((theme) => theme.colors?.primary)),
      secondary: Object.assign({}, ...themes.map((theme) => theme.colors?.secondary)),
      blocked: Object.assign({}, ...themes.map((theme) => theme.colors?.blocked)),
      background: themes
        .map((theme) => theme.colors?.background)
        .reverse()
        .find((x) => x !== undefined),
      text: themes
        .map((theme) => theme.colors?.text)
        .reverse()
        .find((x) => x !== undefined),
      border: themes
        .map((theme) => theme.colors?.border)
        .reverse()
        .find((x) => x !== undefined),
      borderLight: themes
        .map((theme) => theme.colors?.borderLight)
        .reverse()
        .find((x) => x !== undefined),
    },
    spacing: themes
      .map((theme) => theme.spacing)
      .reverse()
      .find((x) => x !== undefined),
  };
}
