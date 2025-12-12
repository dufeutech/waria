/**
 * Click Outside - Detection for closing floating elements
 */

export interface ClickOutsideOptions {
  /**
   * Elements to ignore (clicks inside these won't trigger handler)
   */
  ignore?: HTMLElement | HTMLElement[] | (() => HTMLElement[]);

  /**
   * Only trigger for specific mouse buttons (default: left click only)
   * 0 = left, 1 = middle, 2 = right
   */
  buttons?: number[];

  /**
   * Whether to use capture phase (default: false)
   */
  capture?: boolean;

  /**
   * Whether to also listen for focus changes (default: false)
   */
  detectFocus?: boolean;

  /**
   * Delay before starting to listen (useful for click-triggered elements)
   */
  delay?: number;
}

export type ClickOutsideHandler = (event: MouseEvent | FocusEvent) => void;

/**
 * Create a click-outside detector
 */
export function onClickOutside(
  target: HTMLElement | HTMLElement[],
  handler: ClickOutsideHandler,
  options: ClickOutsideOptions = {}
): () => void {
  const {
    ignore,
    buttons = [0],
    capture = false,
    detectFocus = false,
    delay = 0,
  } = options;

  const targets = Array.isArray(target) ? target : [target];
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let active = false;

  const getIgnoredElements = (): HTMLElement[] => {
    if (!ignore) return [];
    if (typeof ignore === 'function') return ignore();
    return Array.isArray(ignore) ? ignore : [ignore];
  };

  const isInside = (element: Element | null): boolean => {
    if (!element) return false;

    // Check targets
    for (const t of targets) {
      if (t.contains(element)) return true;
    }

    // Check ignored elements
    for (const ignored of getIgnoredElements()) {
      if (ignored.contains(element)) return true;
    }

    return false;
  };

  const handlePointerDown = (event: MouseEvent): void => {
    if (!active) return;

    // Check button
    if (!buttons.includes(event.button)) return;

    const target = event.target as Element | null;

    if (!isInside(target)) {
      handler(event);
    }
  };

  const handleFocusIn = (event: FocusEvent): void => {
    if (!active || !detectFocus) return;

    const target = event.target as Element | null;

    if (!isInside(target)) {
      handler(event);
    }
  };

  const start = (): void => {
    active = true;
    document.addEventListener('pointerdown', handlePointerDown, { capture });
    if (detectFocus) {
      document.addEventListener('focusin', handleFocusIn, { capture });
    }
  };

  // Start with optional delay
  if (delay > 0) {
    timeoutId = setTimeout(start, delay);
  } else {
    // Use requestAnimationFrame to avoid catching the triggering click
    requestAnimationFrame(start);
  }

  // Return cleanup function
  return () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    active = false;
    document.removeEventListener('pointerdown', handlePointerDown, { capture });
    document.removeEventListener('focusin', handleFocusIn, { capture });
  };
}

/**
 * Create a click-outside detector that only fires once
 */
export function onClickOutsideOnce(
  target: HTMLElement | HTMLElement[],
  handler: ClickOutsideHandler,
  options: ClickOutsideOptions = {}
): () => void {
  let cleanup: (() => void) | null = null;

  cleanup = onClickOutside(
    target,
    (event) => {
      cleanup?.();
      handler(event);
    },
    options
  );

  return () => cleanup?.();
}

/**
 * Escape key handler (commonly paired with click-outside)
 */
export function onEscapeKey(
  handler: (event: KeyboardEvent) => void,
  options: { capture?: boolean } = {}
): () => void {
  const { capture = false } = options;

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape') {
      handler(event);
    }
  };

  document.addEventListener('keydown', handleKeyDown, { capture });

  return () => {
    document.removeEventListener('keydown', handleKeyDown, { capture });
  };
}

/**
 * Combined click-outside and escape key handler
 */
export function onDismiss(
  target: HTMLElement | HTMLElement[],
  handler: () => void,
  options: ClickOutsideOptions & { escapeKey?: boolean } = {}
): () => void {
  const { escapeKey = true, ...clickOptions } = options;

  const cleanups: Array<() => void> = [];

  cleanups.push(
    onClickOutside(target, () => handler(), clickOptions)
  );

  if (escapeKey) {
    cleanups.push(
      onEscapeKey(() => handler())
    );
  }

  return () => {
    for (const cleanup of cleanups) {
      cleanup();
    }
  };
}
