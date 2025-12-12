/**
 * Component Factory - defineComponent implementation
 */

import { scheduler } from '../core/scheduler';
import { createEventScope, type EventScope } from '../core/events';
import type { Transition } from '../core/transitions';
import type { State } from '../core/state';
import { createContext, invalidateChildCache } from './context';
import type {
  ComponentSchema,
  PropType,
  CleanupFn,
  ComponentContext,
  WComponent,
} from './types';

// Queue of pending component schemas (for lazy initialization)
const pendingComponents: ComponentSchema<HTMLElement & WComponent>[] = [];

// Whether the library has been initialized
let initialized = false;

/**
 * Parse an attribute value based on type
 */
function parseAttribute(
  value: string | null,
  type: PropType,
  defaultValue?: unknown
): unknown {
  if (value === null) {
    return defaultValue;
  }

  switch (type) {
    case String:
      return value;
    case Number:
      return Number(value);
    case Boolean:
      return value !== null && value !== 'false';
    case Array:
    case Object:
      try {
        return JSON.parse(value);
      } catch {
        return defaultValue;
      }
    default:
      return value;
  }
}

/**
 * Convert a value to an attribute string
 */
function toAttributeValue(value: unknown, type: PropType): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  switch (type) {
    case Boolean:
      return value ? '' : null;
    case Array:
    case Object:
      return JSON.stringify(value);
    default:
      return String(value);
  }
}

/**
 * Update an attribute based on type
 */
function updateAttribute(
  element: HTMLElement,
  name: string,
  value: unknown,
  type: PropType
): void {
  const attrValue = toAttributeValue(value, type);

  if (attrValue === null) {
    element.removeAttribute(name);
  } else {
    element.setAttribute(name, attrValue);
  }
}

/**
 * Convert camelCase to kebab-case
 */
function toKebabCase(str: string): string {
  return str.replace(/([A-Z])/g, '-$1').toLowerCase();
}

/**
 * Actually register a component with the browser's custom elements registry
 */
function registerComponent<T extends HTMLElement = HTMLElement & WComponent>(
  schema: ComponentSchema<T>
): void {
  const {
    tag,
    props = [],
    children = {},
    events = {},
    viewport,
    transitions = {},
    aria,
    setup,
    methods = {},
  } = schema;

  // Validate tag name
  if (!tag.includes('-')) {
    throw new Error(`Component tag must include a hyphen: ${tag}`);
  }

  // Check if already defined
  if (customElements.get(tag)) {
    console.warn(`Component ${tag} is already defined`);
    return;
  }

  // Build observed attributes list
  const observedAttributes = props
    .filter((p) => p.reflect !== false)
    .map((p) => p.attribute ?? toKebabCase(p.name));

  class Component extends HTMLElement implements WComponent {
    // Lifecycle state
    #abortController: AbortController | null = null;
    #eventScope: EventScope | null = null;
    #stateMap = new Map<string, State<unknown>>();
    #transitionMap = new Map<string, Transition>();
    #cleanupFns: CleanupFn[] = [];
    #setupCleanup: CleanupFn | null = null;
    #context: ComponentContext | null = null;

    static get observedAttributes(): string[] {
      return observedAttributes;
    }

    connectedCallback(): void {
      // Reset if reconnecting
      if (this.#abortController?.signal.aborted) {
        this.#abortController = new AbortController();
      } else {
        this.#abortController = new AbortController();
      }

      this.#eventScope = createEventScope(this);

      // Setup delegated events from schema
      for (const [eventType, configs] of Object.entries(events)) {
        const configArray = Array.isArray(configs) ? configs : [configs];
        for (const config of configArray) {
          this.#eventScope.on(eventType, {
            selector: config.selector ?? '*',
            handler: (e, target) => {
              const method = (this as unknown as Record<string, unknown>)[config.handler];
              if (typeof method === 'function') {
                method.call(this, e, target);
              }
            },
            options: {
              prevent: config.prevent,
              stop: config.stop,
              capture: config.capture,
              once: config.once,
            },
          });
        }
      }

      // Setup viewport listeners (RAF-throttled)
      if (viewport) {
        const config = typeof viewport === 'boolean'
          ? { scroll: true, resize: true, handler: 'onViewportChange' }
          : viewport;

        let rafId: number | null = null;

        const handler = (): void => {
          if (rafId !== null) return;
          rafId = requestAnimationFrame(() => {
            rafId = null;
            const method = (this as unknown as Record<string, unknown>)[config.handler];
            if (typeof method === 'function') {
              scheduler.read(() => {
                (method as () => void).call(this);
              });
            }
          });
        };

        if (config.scroll) {
          window.addEventListener('scroll', handler, { passive: true, capture: true });
          this.#cleanupFns.push(() => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener('scroll', handler, { capture: true });
          });
        }

        if (config.resize) {
          window.addEventListener('resize', handler, { passive: true });
          this.#cleanupFns.push(() => {
            if (rafId !== null) cancelAnimationFrame(rafId);
            window.removeEventListener('resize', handler);
          });
        }
      }

      // Setup ARIA
      if (aria?.role) {
        this.setAttribute('role', aria.role);
      }

      // Create context and call setup
      if (setup) {
        this.#context = createContext({
          element: this,
          abortController: this.#abortController,
          eventScope: this.#eventScope,
          children,
          transitions,
          cleanupFns: this.#cleanupFns,
          stateMap: this.#stateMap,
          transitionMap: this.#transitionMap,
        });

        const cleanup = setup.call(this, this.#context as ComponentContext<T>);
        if (typeof cleanup === 'function') {
          this.#setupCleanup = cleanup;
        }
      }
    }

    disconnectedCallback(): void {
      // Abort pending operations
      this.#abortController?.abort();

      // Run setup cleanup
      if (this.#setupCleanup) {
        try {
          this.#setupCleanup();
        } catch (e) {
          console.error(`[${tag}] Setup cleanup error:`, e);
        }
        this.#setupCleanup = null;
      }

      // Destroy event scope
      this.#eventScope?.destroy();
      this.#eventScope = null;

      // Destroy transitions
      for (const transition of this.#transitionMap.values()) {
        transition.destroy();
      }
      this.#transitionMap.clear();

      // Run cleanup functions
      for (const fn of this.#cleanupFns) {
        try {
          fn();
        } catch (e) {
          console.error(`[${tag}] Cleanup error:`, e);
        }
      }
      this.#cleanupFns = [];

      // Clear state
      this.#stateMap.clear();
      this.#abortController = null;
      this.#context = null;
    }

    attributeChangedCallback(
      name: string,
      oldValue: string | null,
      newValue: string | null
    ): void {
      if (oldValue === newValue) return;

      // Find the corresponding prop
      const prop = props.find(
        (p) => (p.attribute ?? toKebabCase(p.name)) === name
      );

      if (prop) {
        // Trigger property setter if it exists
        const propName = prop.name;
        const descriptor = Object.getOwnPropertyDescriptor(
          Component.prototype,
          propName
        );

        if (descriptor?.set) {
          const value = parseAttribute(newValue, prop.type, prop.default);
          (this as unknown as Record<string, unknown>)[propName] = value;
        }
      }
    }

    /**
     * Update the component (invalidate caches, re-query children)
     */
    $update(): void {
      if (this.#context) {
        invalidateChildCache(this.#context);
      }
    }
  }

  // Define reactive properties
  for (const prop of props) {
    const attrName = prop.attribute ?? toKebabCase(prop.name);

    Object.defineProperty(Component.prototype, prop.name, {
      get(this: Component) {
        const attr = this.getAttribute(attrName);
        return parseAttribute(attr, prop.type, prop.default);
      },
      set(this: Component, value: unknown) {
        if (prop.reflect !== false) {
          updateAttribute(this, attrName, value, prop.type);
        }
      },
      enumerable: true,
      configurable: true,
    });
  }

  // Define methods
  for (const [name, method] of Object.entries(methods)) {
    Object.defineProperty(Component.prototype, name, {
      value: method,
      writable: true,
      enumerable: false,
      configurable: true,
    });
  }

  // Register the custom element
  customElements.define(tag, Component);
}

/**
 * Define a custom element from a schema.
 *
 * If the library hasn't been initialized yet, the component is queued
 * and will be registered when `init()` is called.
 *
 * If already initialized, the component is registered immediately.
 */
export function defineComponent<T extends HTMLElement = HTMLElement & WComponent>(
  schema: ComponentSchema<T>
): void {
  if (initialized) {
    // Already initialized - register immediately
    registerComponent(schema);
  } else {
    // Queue for later registration
    pendingComponents.push(schema as unknown as ComponentSchema<HTMLElement & WComponent>);
  }
}

/**
 * Initialize the component library.
 *
 * This registers all queued components with the browser's custom elements registry.
 * Call this after configuring any global settings (like Router).
 *
 * @example
 * ```ts
 * import { Router, init } from 'waria';
 *
 * // Configure before init
 * Router.config({ hash: true });
 *
 * // Now register all components
 * init();
 * ```
 */
export function init(): void {
  if (initialized) {
    return;
  }

  initialized = true;

  // Register all pending components
  for (const schema of pendingComponents) {
    registerComponent(schema);
  }

  // Clear the queue
  pendingComponents.length = 0;
}

/**
 * Check if the library has been initialized
 */
export function isInitialized(): boolean {
  return initialized;
}
