/**
 * Events - Centralized event delegation system
 *
 * Single delegated listener per event type.
 * Selector-based routing with automatic cleanup.
 */

type EventHandler<E extends Event = Event> = (event: E, target: HTMLElement) => void;

interface EventBindingOptions {
  prevent?: boolean;
  stop?: boolean;
  once?: boolean;
  capture?: boolean;
  passive?: boolean;
}

interface EventBinding<E extends Event = Event> {
  selector: string;
  handler: EventHandler<E>;
  options?: EventBindingOptions;
}

interface EventScope {
  on<E extends Event = Event>(
    event: string,
    binding: EventBinding<E>
  ): () => void;
  on<E extends Event = Event>(
    event: string,
    selector: string,
    handler: EventHandler<E>,
    options?: EventBindingOptions
  ): () => void;
  off(event: string, selector?: string): void;
  emit<T>(event: string, detail?: T, options?: CustomEventInit): boolean;
  destroy(): void;
}

interface DelegatedBinding {
  selector: string;
  handler: EventHandler;
  options: EventBindingOptions;
  id: number;
}

interface DelegatedListener {
  bindings: Map<number, DelegatedBinding>;
  listener: (event: Event) => void;
  capture: boolean;
}

let bindingIdCounter = 0;

export function createEventScope(root: HTMLElement): EventScope {
  const listeners = new Map<string, DelegatedListener>();
  let destroyed = false;

  const getEventKey = (event: string, capture: boolean): string => {
    return `${event}:${capture}`;
  };

  const matchesSelector = (element: Element | null, selector: string, root: HTMLElement): HTMLElement | null => {
    if (!element || element === root.parentElement) return null;

    // Handle special selectors
    if (selector === '*' || selector === ':scope') {
      return element instanceof HTMLElement ? element : null;
    }

    // Walk up from target to root looking for match
    let current: Element | null = element;
    while (current && current !== root.parentElement) {
      if (current instanceof HTMLElement && current.matches(selector)) {
        return current;
      }
      current = current.parentElement;
    }

    return null;
  };

  const createDelegatedListener = (eventType: string, capture: boolean): DelegatedListener => {
    const bindings = new Map<number, DelegatedBinding>();

    const listener = (event: Event): void => {
      if (destroyed) return;

      const target = event.target as Element | null;
      if (!target) return;

      // Process bindings in order
      for (const binding of bindings.values()) {
        const matchedTarget = matchesSelector(target, binding.selector, root);
        if (matchedTarget) {
          const { options } = binding;

          if (options.prevent) {
            event.preventDefault();
          }
          if (options.stop) {
            event.stopPropagation();
          }

          try {
            binding.handler(event, matchedTarget);
          } catch (e) {
            console.error('[Events] Handler error:', e);
          }

          if (options.once) {
            bindings.delete(binding.id);
          }
        }
      }
    };

    root.addEventListener(eventType, listener, {
      capture,
      passive: false, // We may need to prevent default
    });

    return { bindings, listener, capture };
  };

  const ensureListener = (eventType: string, capture: boolean): DelegatedListener => {
    const key = getEventKey(eventType, capture);
    let delegated = listeners.get(key);

    if (!delegated) {
      delegated = createDelegatedListener(eventType, capture);
      listeners.set(key, delegated);
    }

    return delegated;
  };

  return {
    on<E extends Event = Event>(
      event: string,
      bindingOrSelector: EventBinding<E> | string,
      handlerOrOptions?: EventHandler<E> | EventBindingOptions,
      maybeOptions?: EventBindingOptions
    ): () => void {
      if (destroyed) {
        console.warn('[Events] Cannot add listener to destroyed scope');
        return () => {};
      }

      let binding: DelegatedBinding;

      if (typeof bindingOrSelector === 'string') {
        // Overload: on(event, selector, handler, options?)
        binding = {
          selector: bindingOrSelector,
          handler: handlerOrOptions as EventHandler,
          options: maybeOptions ?? {},
          id: ++bindingIdCounter,
        };
      } else {
        // Overload: on(event, binding)
        binding = {
          selector: bindingOrSelector.selector,
          handler: bindingOrSelector.handler as EventHandler,
          options: bindingOrSelector.options ?? {},
          id: ++bindingIdCounter,
        };
      }

      const capture = binding.options.capture ?? false;
      const delegated = ensureListener(event, capture);
      delegated.bindings.set(binding.id, binding);

      // Return cleanup function
      return () => {
        delegated.bindings.delete(binding.id);
      };
    },

    off(event: string, selector?: string): void {
      // Remove all bindings for event, optionally filtered by selector
      for (const [key, delegated] of listeners) {
        if (key.startsWith(`${event}:`)) {
          if (selector) {
            for (const [id, binding] of delegated.bindings) {
              if (binding.selector === selector) {
                delegated.bindings.delete(id);
              }
            }
          } else {
            delegated.bindings.clear();
          }
        }
      }
    },

    emit<T>(event: string, detail?: T, options?: CustomEventInit): boolean {
      const customEvent = new CustomEvent(event, {
        detail,
        bubbles: true,
        cancelable: true,
        ...options,
      });
      return root.dispatchEvent(customEvent);
    },

    destroy(): void {
      if (destroyed) return;
      destroyed = true;

      for (const [key, delegated] of listeners) {
        const [eventType] = key.split(':');
        root.removeEventListener(eventType, delegated.listener, {
          capture: delegated.capture,
        });
        delegated.bindings.clear();
      }

      listeners.clear();
    },
  };
}

export type { EventScope, EventBinding, EventBindingOptions, EventHandler };
