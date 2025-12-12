/**
 * Observe - MutationObserver utilities for attribute watching
 *
 * Simplifies the common pattern of watching specific attributes
 * and calling a handler when they change.
 */

export interface AttributeObserverConfig {
  /** Element to observe */
  element: HTMLElement;
  /** Attribute names to watch */
  attributes: string[];
  /** Handler called when any watched attribute changes */
  handler: (attributeName: string, oldValue: string | null, newValue: string | null) => void;
}

/**
 * Create an attribute observer that watches specific attributes
 * and calls a handler when they change.
 *
 * @returns Cleanup function to disconnect the observer
 *
 * @example
 * const cleanup = observeAttributes({
 *   element: myElement,
 *   attributes: ['pressed', 'disabled', 'label'],
 *   handler: () => updateAria(),
 * });
 *
 * // Later: cleanup();
 */
export function observeAttributes(config: AttributeObserverConfig): () => void {
  const { element, attributes, handler } = config;
  const attributeSet = new Set(attributes);

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === 'attributes' &&
        mutation.attributeName &&
        attributeSet.has(mutation.attributeName)
      ) {
        const newValue = element.getAttribute(mutation.attributeName);
        handler(mutation.attributeName, mutation.oldValue, newValue);
      }
    }
  });

  observer.observe(element, {
    attributes: true,
    attributeFilter: attributes,
    attributeOldValue: true,
  });

  return () => observer.disconnect();
}

/**
 * Simplified observer that just calls a callback when any
 * watched attribute changes (without old/new value details).
 *
 * @example
 * const cleanup = onAttributeChange(element, ['open', 'disabled'], updateAria);
 */
export function onAttributeChange(
  element: HTMLElement,
  attributes: string[],
  callback: () => void
): () => void {
  return observeAttributes({
    element,
    attributes,
    handler: callback,
  });
}
