/**
 * Portal - Manages floating element containers with z-index stacking
 */

const PORTAL_ID = 'w-portal';
const BASE_Z_INDEX = 1000;

interface PortalStack {
  element: HTMLElement;
  zIndex: number;
}

// Global portal container and stack
let portalContainer: HTMLElement | null = null;
const stack: PortalStack[] = [];

/**
 * Get or create the portal container element
 */
export function getPortalContainer(): HTMLElement {
  if (portalContainer && document.body.contains(portalContainer)) {
    return portalContainer;
  }

  // Check if container already exists
  portalContainer = document.getElementById(PORTAL_ID);

  if (!portalContainer) {
    portalContainer = document.createElement('div');
    portalContainer.id = PORTAL_ID;
    portalContainer.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 0;
      height: 0;
      z-index: ${BASE_Z_INDEX};
      pointer-events: none;
    `;
    document.body.appendChild(portalContainer);
  }

  return portalContainer;
}

/**
 * Get the current z-index for a new portal element
 */
export function getNextZIndex(): number {
  return BASE_Z_INDEX + stack.length + 1;
}

/**
 * Get the top-most element in the portal stack
 */
export function getTopStack(): PortalStack | null {
  return stack[stack.length - 1] ?? null;
}

/**
 * Check if an element is in the portal stack
 */
export function isInStack(element: HTMLElement): boolean {
  return stack.some((item) => item.element === element);
}

/**
 * Push an element onto the portal stack
 */
export function pushStack(element: HTMLElement): number {
  const zIndex = getNextZIndex();
  element.style.zIndex = String(zIndex);
  stack.push({ element, zIndex });
  return zIndex;
}

/**
 * Pop an element from the portal stack
 */
export function popStack(element: HTMLElement): void {
  const index = stack.findIndex((item) => item.element === element);
  if (index !== -1) {
    stack.splice(index, 1);
  }
}

export interface Portal {
  mount(element: HTMLElement): void;
  unmount(element: HTMLElement): void;
  contains(element: HTMLElement): boolean;
  getContainer(): HTMLElement;
}

/**
 * Create a portal manager
 */
export function createPortal(id?: string): Portal {
  let container: HTMLElement | null = null;

  const getContainer = (): HTMLElement => {
    if (container && document.body.contains(container)) {
      return container;
    }

    const parent = getPortalContainer();

    if (id) {
      container = parent.querySelector(`#${id}`);
    }

    if (!container) {
      container = document.createElement('div');
      if (id) {
        container.id = id;
      }
      container.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        pointer-events: auto;
      `;
      parent.appendChild(container);
    }

    return container;
  };

  return {
    mount(element: HTMLElement): void {
      const target = getContainer();
      const zIndex = pushStack(element);
      element.style.zIndex = String(zIndex);
      element.style.pointerEvents = 'auto';
      target.appendChild(element);
    },

    unmount(element: HTMLElement): void {
      popStack(element);
      if (element.parentElement === container) {
        element.remove();
      }
    },

    contains(element: HTMLElement): boolean {
      return container?.contains(element) ?? false;
    },

    getContainer,
  };
}

/**
 * Teleport an element to the portal container
 */
export function teleport(element: HTMLElement): () => void {
  const originalParent = element.parentElement;
  const originalNextSibling = element.nextSibling;
  const container = getPortalContainer();

  const zIndex = pushStack(element);
  element.style.zIndex = String(zIndex);
  element.style.pointerEvents = 'auto';
  container.appendChild(element);

  // Return cleanup function
  return () => {
    popStack(element);
    if (originalParent) {
      originalParent.insertBefore(element, originalNextSibling);
    } else {
      element.remove();
    }
  };
}

/**
 * Check if the portal contains a given element (for click-outside detection)
 */
export function portalContains(target: Node): boolean {
  return portalContainer?.contains(target) ?? false;
}
