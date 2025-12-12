/**
 * ID Generation - Unique ID utilities for ARIA relationships
 */

let idCounter = 0;
const PREFIX = 'w';

/**
 * Generate a unique ID with optional prefix
 */
export function generateId(prefix = PREFIX): string {
  return `${prefix}-${++idCounter}`;
}

/**
 * Ensure an element has an ID, generating one if needed
 */
export function ensureId(element: HTMLElement, prefix = PREFIX): string {
  if (!element.id) {
    element.id = generateId(prefix);
  }
  return element.id;
}

/**
 * Generate a unique ID for a specific purpose
 */
export function generateScopedId(scope: string, suffix?: string): string {
  const base = `${PREFIX}-${scope}-${++idCounter}`;
  return suffix ? `${base}-${suffix}` : base;
}

/**
 * Reset ID counter (for testing)
 */
export function resetIdCounter(): void {
  idCounter = 0;
}
