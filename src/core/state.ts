/**
 * State - Standardized state container for component internals
 *
 * Reactive state container with change detection.
 * Supports lazy initialization and computed values.
 */

type StateInitializer<T> = T | (() => T);
type StateUpdater<T> = T | ((prev: T) => T);
type StateSubscriber<T> = (value: T, prev: T) => void;

interface StateConfig<T> {
  initial: StateInitializer<T>;
  lazy?: boolean;
  onChange?: StateSubscriber<T>;
  equals?: (a: T, b: T) => boolean;
}

interface State<T> {
  get(): T;
  set(value: StateUpdater<T>): void;
  update(partial: Partial<T>): void;
  subscribe(fn: StateSubscriber<T>): () => void;
  reset(): void;
}

const defaultEquals = <T>(a: T, b: T): boolean => {
  if (a === b) return true;
  if (typeof a !== 'object' || typeof b !== 'object') return false;
  if (a === null || b === null) return false;

  // Shallow comparison for objects
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) =>
    Object.prototype.hasOwnProperty.call(b, key) &&
    (a as Record<string, unknown>)[key] === (b as Record<string, unknown>)[key]
  );
};

export function createState<T>(config: StateConfig<T>): State<T> {
  const { initial, lazy = false, onChange, equals = defaultEquals } = config;

  let value: T | undefined;
  let initialized = !lazy;
  const subscribers = new Set<StateSubscriber<T>>();

  const getInitialValue = (): T => {
    return typeof initial === 'function'
      ? (initial as () => T)()
      : initial;
  };

  if (!lazy) {
    value = getInitialValue();
  }

  const notify = (next: T, prev: T): void => {
    if (onChange) {
      try {
        onChange(next, prev);
      } catch (e) {
        console.error('[State] onChange error:', e);
      }
    }

    for (const subscriber of subscribers) {
      try {
        subscriber(next, prev);
      } catch (e) {
        console.error('[State] Subscriber error:', e);
      }
    }
  };

  return {
    get(): T {
      if (!initialized) {
        value = getInitialValue();
        initialized = true;
      }
      return value as T;
    },

    set(updater: StateUpdater<T>): void {
      const prev = this.get();
      const next = typeof updater === 'function'
        ? (updater as (prev: T) => T)(prev)
        : updater;

      if (!equals(prev, next)) {
        value = next;
        notify(next, prev);
      }
    },

    update(partial: Partial<T>): void {
      const prev = this.get();
      if (typeof prev !== 'object' || prev === null) {
        console.warn('[State] update() can only be used with object state');
        return;
      }

      const next = { ...prev, ...partial } as T;
      if (!equals(prev, next)) {
        value = next;
        notify(next, prev);
      }
    },

    subscribe(fn: StateSubscriber<T>): () => void {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
      };
    },

    reset(): void {
      const prev = value as T;
      value = getInitialValue();
      initialized = true;
      notify(value, prev);
    },
  };
}

/**
 * Create a derived/computed state from other states
 */
export function createDerived<T, D>(
  sources: State<T>[],
  derive: (values: T[]) => D
): { get(): D; subscribe(fn: (value: D) => void): () => void } {
  const subscribers = new Set<(value: D) => void>();
  let cachedValue: D | undefined;
  let dirty = true;

  const unsubscribes = sources.map((source) =>
    source.subscribe(() => {
      dirty = true;
      const newValue = derive(sources.map((s) => s.get()));
      if (newValue !== cachedValue) {
        cachedValue = newValue;
        for (const sub of subscribers) {
          sub(cachedValue);
        }
      }
    })
  );

  return {
    get(): D {
      if (dirty) {
        cachedValue = derive(sources.map((s) => s.get()));
        dirty = false;
      }
      return cachedValue as D;
    },

    subscribe(fn: (value: D) => void): () => void {
      subscribers.add(fn);
      return () => {
        subscribers.delete(fn);
        if (subscribers.size === 0) {
          // Cleanup source subscriptions when no subscribers
          for (const unsub of unsubscribes) {
            unsub();
          }
        }
      };
    },
  };
}

export type { State, StateConfig, StateSubscriber, StateUpdater };
