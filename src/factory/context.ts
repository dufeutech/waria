/**
 * Context Factory - Creates ComponentContext for setup functions
 */

import { scheduler } from '../core/scheduler';
import { cache } from '../core/cache';
import { createState, type State } from '../core/state';
import { createTransition, type Transition } from '../core/transitions';
import type { EventScope } from '../core/events';
import type {
  ComponentContext,
  ChildDefinition,
  SchemaTransitionConfig,
  CleanupFn,
} from './types';

export interface ContextConfig {
  element: HTMLElement;
  abortController: AbortController;
  eventScope: EventScope;
  children?: { [key: string]: ChildDefinition };
  transitions?: { [name: string]: SchemaTransitionConfig };
  cleanupFns: CleanupFn[];
  stateMap: Map<string, State<unknown>>;
  transitionMap: Map<string, Transition>;
}

/**
 * Create a ComponentContext for the setup function
 */
export function createContext(config: ContextConfig): ComponentContext {
  const {
    element,
    abortController,
    eventScope,
    children = {},
    transitions = {},
    cleanupFns,
    stateMap,
    transitionMap,
  } = config;

  // Child cache for lazy access
  const childCache = new Map<string, unknown>();

  // Initialize transitions
  for (const [name, transConfig] of Object.entries(transitions)) {
    const target = transConfig.target
      ? element.querySelector<HTMLElement>(transConfig.target)
      : element;

    if (target instanceof HTMLElement) {
      transitionMap.set(name, createTransition(target, transConfig));
    }
  }

  let stateCounter = 0;

  const ctx: ComponentContext = {
    element,
    signal: abortController.signal,

    state<S>(initial: S): State<S> {
      const key = `state_${stateCounter++}`;
      if (stateMap.has(key)) {
        return stateMap.get(key) as State<S>;
      }
      const state = createState({ initial });
      stateMap.set(key, state as State<unknown>);
      return state;
    },

    get children(): { [key: string]: HTMLElement | HTMLElement[] | null } {
      return new Proxy({} as { [key: string]: HTMLElement | HTMLElement[] | null }, {
        get(_, key: string) {
          if (childCache.has(key)) {
            return childCache.get(key);
          }

          const config = children[key];
          if (!config) return null;

          const selector = typeof config === 'string' ? config : config.selector;
          const multiple = typeof config === 'object' && config.multiple;

          const result = multiple
            ? Array.from(element.querySelectorAll<HTMLElement>(selector))
            : element.querySelector<HTMLElement>(selector);

          // Only cache if not observing
          const shouldCache = typeof config === 'string' || !config.observe;
          if (shouldCache) {
            childCache.set(key, result);
          }

          return result;
        },
      });
    },

    get transitions(): { [name: string]: Transition } {
      return Object.fromEntries(transitionMap);
    },

    events: eventScope,
    scheduler,
    cache,

    onCleanup(fn: CleanupFn): void {
      cleanupFns.push(fn);
    },

    query<E extends Element = Element>(selector: string): E | null {
      return cache.query.one<E>(element, selector);
    },

    queryAll<E extends Element = Element>(selector: string): E[] {
      return cache.query.all<E>(element, selector);
    },

    querySlot<E extends Element = Element>(slot: string): E[] {
      return cache.query.all<E>(element, `w-slot[${slot}] > *`);
    },

    emit<D = unknown>(event: string, detail?: D, options?: CustomEventInit): boolean {
      const customEvent = new CustomEvent(event, {
        detail,
        bubbles: true,
        cancelable: true,
        ...options,
      });

      // Check for w-{event} attribute handler (e.g., w-open, w-close, w-change)
      // Using w-* prefix avoids collision with native browser event handlers
      const attrHandler = element.getAttribute(`w-${event}`);

      if (attrHandler) {
        try {
          const fn = new Function('event', attrHandler);
          fn.call(element, customEvent);
        } catch (e) {
          console.error(`Error in w-${event} handler:`, e);
        }
      }

      return element.dispatchEvent(customEvent);
    },

    aria: {
      setExpanded(value: boolean): void {
        element.setAttribute('aria-expanded', String(value));
      },
      setSelected(value: boolean): void {
        element.setAttribute('aria-selected', String(value));
      },
      setChecked(value: boolean | 'mixed'): void {
        element.setAttribute('aria-checked', String(value));
      },
      setPressed(value: boolean | 'mixed'): void {
        element.setAttribute('aria-pressed', String(value));
      },
      setDisabled(value: boolean): void {
        element.setAttribute('aria-disabled', String(value));
      },
      setHidden(value: boolean): void {
        element.setAttribute('aria-hidden', String(value));
      },
      setActiveDescendant(id: string | null): void {
        if (id) {
          element.setAttribute('aria-activedescendant', id);
        } else {
          element.removeAttribute('aria-activedescendant');
        }
      },
    },
  };

  return ctx;
}

/**
 * Invalidate child cache (for $update)
 */
export function invalidateChildCache(
  ctx: ComponentContext
): void {
  cache.query.invalidate(ctx.element);
}
