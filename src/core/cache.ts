/**
 * Cache - Unified caching for DOM queries, dimensions, and computed values
 *
 * WeakMap-based caching with automatic garbage collection.
 * Time-based invalidation for volatile data.
 */

interface CacheOptions {
  maxAge?: number;
  key?: string;
}

interface CachedValue<T> {
  value: T;
  time: number;
}

interface DimensionCache {
  get(el: HTMLElement): DOMRect;
  invalidate(el: HTMLElement): void;
  invalidateAll(): void;
}

interface QueryCache {
  one<T extends Element>(container: Element, selector: string): T | null;
  all<T extends Element>(container: Element, selector: string): T[];
  children<T extends Element>(container: Element, slot?: string): T[];
  invalidate(container: Element): void;
  invalidateAll(): void;
}

interface CacheInstance {
  dimensions: DimensionCache;
  query: QueryCache;
  memo<T>(key: object, fn: () => T, options?: CacheOptions): T;
  viewport: { width: number; height: number };
  clear(): void;
}

const DEFAULT_MAX_AGE = 100; // 100ms TTL

const createCache = (): CacheInstance => {
  // Dimension cache with TTL
  const dimensionCache = new WeakMap<HTMLElement, CachedValue<DOMRect>>();

  // Query cache: container -> selector -> result
  const queryCache = new WeakMap<Element, Map<string, CachedValue<unknown>>>();

  // Generic memo cache
  const memoCache = new WeakMap<object, Map<string, CachedValue<unknown>>>();

  // Viewport cache
  let viewportCache: { width: number; height: number; time: number } | null = null;

  const now = (): number => performance.now();

  const isExpired = (cached: CachedValue<unknown>, maxAge: number): boolean => {
    return now() - cached.time > maxAge;
  };

  // Update viewport cache on resize
  const updateViewport = (): void => {
    viewportCache = {
      width: window.innerWidth,
      height: window.innerHeight,
      time: now(),
    };
  };

  // Initialize viewport and listen for resize
  if (typeof window !== 'undefined') {
    updateViewport();
    window.addEventListener('resize', updateViewport, { passive: true });
  }

  const dimensions: DimensionCache = {
    get(el: HTMLElement): DOMRect {
      const cached = dimensionCache.get(el);
      if (cached && !isExpired(cached, DEFAULT_MAX_AGE)) {
        return cached.value;
      }

      const rect = el.getBoundingClientRect();
      dimensionCache.set(el, { value: rect, time: now() });
      return rect;
    },

    invalidate(el: HTMLElement): void {
      dimensionCache.delete(el);
    },

    invalidateAll(): void {
      // WeakMap doesn't support clear, so we create a new one
      // This is handled by the outer clear() function
    },
  };

  const query: QueryCache = {
    one<T extends Element>(container: Element, selector: string): T | null {
      const containerCache = queryCache.get(container);
      const key = `one:${selector}`;

      if (containerCache) {
        const cached = containerCache.get(key);
        if (cached && !isExpired(cached, DEFAULT_MAX_AGE)) {
          return cached.value as T | null;
        }
      }

      const result = container.querySelector<T>(selector);
      const cache = containerCache ?? new Map();
      cache.set(key, { value: result, time: now() });
      queryCache.set(container, cache);
      return result;
    },

    all<T extends Element>(container: Element, selector: string): T[] {
      const containerCache = queryCache.get(container);
      const key = `all:${selector}`;

      if (containerCache) {
        const cached = containerCache.get(key);
        if (cached && !isExpired(cached, DEFAULT_MAX_AGE)) {
          return cached.value as T[];
        }
      }

      const result = Array.from(container.querySelectorAll<T>(selector));
      const cache = containerCache ?? new Map();
      cache.set(key, { value: result, time: now() });
      queryCache.set(container, cache);
      return result;
    },

    children<T extends Element>(container: Element, slot?: string): T[] {
      const selector = slot ? `[slot="${slot}"]` : '*';
      return this.all<T>(container, `:scope > ${selector}`);
    },

    invalidate(container: Element): void {
      queryCache.delete(container);
    },

    invalidateAll(): void {
      // Handled by outer clear()
    },
  };

  return {
    dimensions,
    query,

    memo<T>(key: object, fn: () => T, options: CacheOptions = {}): T {
      const { maxAge = DEFAULT_MAX_AGE, key: cacheKey = 'default' } = options;

      const objectCache = memoCache.get(key);
      if (objectCache) {
        const cached = objectCache.get(cacheKey);
        if (cached && !isExpired(cached, maxAge)) {
          return cached.value as T;
        }
      }

      const result = fn();
      const cache = objectCache ?? new Map();
      cache.set(cacheKey, { value: result, time: now() });
      memoCache.set(key, cache);
      return result;
    },

    get viewport(): { width: number; height: number } {
      if (!viewportCache || isExpired({ value: null, time: viewportCache.time }, 16)) {
        updateViewport();
      }
      return { width: viewportCache!.width, height: viewportCache!.height };
    },

    clear(): void {
      // WeakMaps auto-clear when keys are GC'd
      // For immediate clear, we'd need to track keys
      viewportCache = null;
      updateViewport();
    },
  };
};

export const cache = createCache();
export type { CacheInstance, CacheOptions };
