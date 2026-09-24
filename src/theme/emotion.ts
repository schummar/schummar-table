import createCache, { type EmotionCache } from '@emotion/cache';
import { __unsafe_useEmotionCache, useTheme as useEmotionTheme } from '@emotion/react';
import { serializeStyles, type Interpolation, type SerializedStyles } from '@emotion/serialize';
import { insertStyles } from '@emotion/utils';
import { useMemo } from 'react';

export type ClassNameOf = (...styles: Interpolation<any>[]) => string;

const isServer = typeof document === 'undefined';

const isSerialized = (x: object): x is SerializedStyles =>
  typeof (x as SerializedStyles).name === 'string' &&
  typeof (x as SerializedStyles).styles === 'string';

/**
 * Turns emotion styles into a class name without re-serializing them on every call: serialized styles
 * are keyed by their hash, objects and functions by identity. Styles are inserted on the client only.
 */
function createClassNameOf(cache: EmotionCache, theme: object | undefined): ClassNameOf {
  const classNames = new Map<string, string>();
  const ids = new WeakMap<object, number>();
  let nextId = 0;

  const keyOf = (style: Interpolation<any>): string => {
    if (style === null || style === undefined || typeof style === 'boolean') return '';
    if (typeof style !== 'object' && typeof style !== 'function') {
      return `${typeof style}:${String(style)}`;
    }
    if (typeof style === 'object' && isSerialized(style)) return `s:${style.name}`;
    let id = ids.get(style);
    if (id === undefined) ids.set(style, (id = nextId++));
    return `o:${id}`;
  };

  return (...styles) => {
    const key = JSON.stringify(styles.map(keyOf));
    let className = classNames.get(key);
    if (className === undefined) {
      // The theme is what the css prop passes to function interpolations.
      const serialized = serializeStyles(styles, cache.registered, theme);
      if (!isServer) insertStyles(cache, serialized, false);
      className = serialized.styles ? `${cache.key}-${serialized.name}` : '';
      // Function styles returning fresh objects would grow this forever.
      if (classNames.size > 5000) classNames.clear();
      classNames.set(key, className);
    }
    return className;
  };
}

// Without a CacheProvider, @emotion/react uses a cache keyed `css` in the browser and none on the
// server; these mirror it so server and client produce the same class names.
let standaloneAppCache: EmotionCache | undefined;
const getStandaloneAppCache = () => (standaloneAppCache ??= createCache({ key: 'css' }));

const libraryClassNameOf = new WeakMap<EmotionCache, ClassNameOf>();

/**
 * For the library's own styles. They go into a separate cache that is prepended to the document, so
 * user styles of equal specificity (emotion or plain CSS) always override them. It inherits the app
 * cache's nonce and container.
 */
export function useLibraryClassName(): ClassNameOf {
  const appCache = __unsafe_useEmotionCache() ?? getStandaloneAppCache();

  return useMemo(() => {
    let classNameOf = libraryClassNameOf.get(appCache);
    if (!classNameOf) {
      // A prepended sheet takes the top spot when it creates its first tag. If the app cache is
      // prepended too (MUI's recommended setup) and hasn't created one yet, it would later land above
      // ours and lose to the library styles, so make it create its tag first.
      if (!isServer && appCache.sheet.tags.length === 0) {
        insertStyles(appCache, serializeStyles(['--schummar-table: 1;']), false);
      }

      classNameOf = createClassNameOf(
        createCache({
          key: `${appCache.key}-st`,
          prepend: true,
          nonce: appCache.nonce,
          container: appCache.sheet.container,
        }),
        undefined,
      );
      libraryClassNameOf.set(appCache, classNameOf);
    }
    return classNameOf;
  }, [appCache]);
}

const userClassNameOf = new WeakMap<EmotionCache, WeakMap<object, ClassNameOf>>();

/**
 * For user supplied styles, and for library styles that must beat a theme component's own styles:
 * the app's emotion cache, with its theme for function interpolations.
 */
export function useUserClassName(): ClassNameOf {
  const appCache = __unsafe_useEmotionCache() ?? getStandaloneAppCache();
  const theme = useEmotionTheme();

  return useMemo(() => {
    let byTheme = userClassNameOf.get(appCache);
    if (!byTheme) userClassNameOf.set(appCache, (byTheme = new WeakMap()));

    let classNameOf = byTheme.get(theme);
    if (!classNameOf) byTheme.set(theme, (classNameOf = createClassNameOf(appCache, theme)));
    return classNameOf;
  }, [appCache, theme]);
}
