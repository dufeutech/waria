/**
 * Focus - Focus management utilities for accessibility
 */

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'area[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
  '[contenteditable]',
  'audio[controls]',
  'video[controls]',
  'details > summary:first-of-type',
].join(',');

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const elements = Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  );

  return elements.filter((el) => {
    // Filter out hidden elements
    if (el.offsetParent === null && el.getAttribute('tabindex') !== '-1') {
      return false;
    }
    // Filter out elements with visibility hidden
    const style = getComputedStyle(el);
    return style.visibility !== 'hidden' && style.display !== 'none';
  });
}

/**
 * Get the first focusable element
 */
export function getFirstFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[0] ?? null;
}

/**
 * Get the last focusable element
 */
export function getLastFocusable(container: HTMLElement): HTMLElement | null {
  const focusable = getFocusableElements(container);
  return focusable[focusable.length - 1] ?? null;
}

// Focus restoration stack
let savedFocus: HTMLElement | null = null;

/**
 * Save the currently focused element for later restoration
 */
export function saveFocus(): void {
  savedFocus = document.activeElement as HTMLElement;
}

/**
 * Restore focus to the previously saved element
 */
export function restoreFocus(): void {
  if (savedFocus && document.body.contains(savedFocus)) {
    savedFocus.focus();
  }
  savedFocus = null;
}

/**
 * Get the saved focus element
 */
export function getSavedFocus(): HTMLElement | null {
  return savedFocus;
}

export interface FocusTrap {
  activate(): void;
  deactivate(): void;
  pause(): void;
  unpause(): void;
}

/**
 * Create a focus trap within a container
 */
export function createFocusTrap(
  container: HTMLElement,
  options: {
    initialFocus?: HTMLElement | string | (() => HTMLElement | null);
    returnFocus?: boolean;
    escapeDeactivates?: boolean;
    onEscape?: () => void;
  } = {}
): FocusTrap {
  const {
    initialFocus,
    returnFocus = true,
    escapeDeactivates = true,
    onEscape,
  } = options;

  let active = false;
  let paused = false;
  let previouslyFocused: HTMLElement | null = null;

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (!active || paused) return;

    if (event.key === 'Tab') {
      const focusable = getFocusableElements(container);
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = document.activeElement;

      if (event.shiftKey) {
        // Shift+Tab: Move backwards
        if (current === first || !container.contains(current as Node)) {
          event.preventDefault();
          last.focus();
        }
      } else {
        // Tab: Move forwards
        if (current === last || !container.contains(current as Node)) {
          event.preventDefault();
          first.focus();
        }
      }
    }

    if (event.key === 'Escape' && escapeDeactivates) {
      event.preventDefault();
      onEscape?.();
    }
  };

  const handleFocusIn = (event: FocusEvent): void => {
    if (!active || paused) return;

    const target = event.target as HTMLElement;
    if (!container.contains(target)) {
      // Focus moved outside, bring it back
      const focusable = getFocusableElements(container);
      if (focusable.length > 0) {
        focusable[0].focus();
      }
    }
  };

  const getInitialFocus = (): HTMLElement | null => {
    if (!initialFocus) {
      return getFirstFocusable(container);
    }

    if (typeof initialFocus === 'string') {
      return container.querySelector(initialFocus);
    }

    if (typeof initialFocus === 'function') {
      return initialFocus();
    }

    return initialFocus;
  };

  return {
    activate(): void {
      if (active) return;
      active = true;

      if (returnFocus) {
        previouslyFocused = document.activeElement as HTMLElement;
      }

      document.addEventListener('keydown', handleKeyDown, true);
      document.addEventListener('focusin', handleFocusIn, true);

      // Focus initial element
      const initial = getInitialFocus();
      if (initial) {
        initial.focus();
      }
    },

    deactivate(): void {
      if (!active) return;
      active = false;

      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);

      if (returnFocus && previouslyFocused && document.body.contains(previouslyFocused)) {
        previouslyFocused.focus();
      }
      previouslyFocused = null;
    },

    pause(): void {
      paused = true;
    },

    unpause(): void {
      paused = false;
    },
  };
}

export interface RovingTabindex {
  focus(index: number): void;
  next(): void;
  prev(): void;
  first(): void;
  last(): void;
  getCurrentIndex(): number;
  setItems(items: HTMLElement[]): void;
  destroy(): void;
}

/**
 * Create roving tabindex navigation
 */
export function createRovingTabindex(
  items: HTMLElement[],
  options: {
    initialIndex?: number;
    wrap?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onFocus?: (index: number, element: HTMLElement) => void;
  } = {}
): RovingTabindex {
  const {
    initialIndex = 0,
    wrap = true,
    orientation = 'both',
    onFocus,
  } = options;

  let currentItems = [...items];
  let currentIndex = Math.min(initialIndex, items.length - 1);

  const updateTabindex = (focusIndex: number): void => {
    currentItems.forEach((item, i) => {
      item.setAttribute('tabindex', i === focusIndex ? '0' : '-1');
    });
  };

  // Initialize
  updateTabindex(currentIndex);

  const focus = (index: number): void => {
    if (index < 0 || index >= currentItems.length) return;

    currentIndex = index;
    updateTabindex(currentIndex);
    currentItems[currentIndex]?.focus();
    onFocus?.(currentIndex, currentItems[currentIndex]);
  };

  const move = (delta: number): void => {
    let newIndex = currentIndex + delta;

    if (wrap) {
      newIndex = ((newIndex % currentItems.length) + currentItems.length) % currentItems.length;
    } else {
      newIndex = Math.max(0, Math.min(newIndex, currentItems.length - 1));
    }

    focus(newIndex);
  };

  const handleKeyDown = (event: KeyboardEvent): void => {
    const isHorizontal = orientation === 'horizontal' || orientation === 'both';
    const isVertical = orientation === 'vertical' || orientation === 'both';

    switch (event.key) {
      case 'ArrowRight':
        if (isHorizontal) {
          event.preventDefault();
          event.stopPropagation();
          move(1);
        }
        break;
      case 'ArrowLeft':
        if (isHorizontal) {
          event.preventDefault();
          event.stopPropagation();
          move(-1);
        }
        break;
      case 'ArrowDown':
        if (isVertical) {
          event.preventDefault();
          event.stopPropagation();
          move(1);
        }
        break;
      case 'ArrowUp':
        if (isVertical) {
          event.preventDefault();
          event.stopPropagation();
          move(-1);
        }
        break;
      case 'Home':
        event.preventDefault();
        event.stopPropagation();
        focus(0);
        break;
      case 'End':
        event.preventDefault();
        event.stopPropagation();
        focus(currentItems.length - 1);
        break;
    }
  };

  // Attach keyboard handler to each item
  currentItems.forEach((item) => {
    item.addEventListener('keydown', handleKeyDown);
  });

  return {
    focus,
    next(): void {
      move(1);
    },
    prev(): void {
      move(-1);
    },
    first(): void {
      focus(0);
    },
    last(): void {
      focus(currentItems.length - 1);
    },
    getCurrentIndex(): number {
      return currentIndex;
    },
    setItems(newItems: HTMLElement[]): void {
      // Remove handlers from old items
      currentItems.forEach((item) => {
        item.removeEventListener('keydown', handleKeyDown);
      });

      // Update items
      currentItems = [...newItems];
      currentIndex = Math.min(currentIndex, currentItems.length - 1);

      // Add handlers to new items
      currentItems.forEach((item) => {
        item.addEventListener('keydown', handleKeyDown);
      });

      updateTabindex(currentIndex);
    },
    destroy(): void {
      currentItems.forEach((item) => {
        item.removeEventListener('keydown', handleKeyDown);
      });
    },
  };
}
