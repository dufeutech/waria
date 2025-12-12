/**
 * ARIA Live Regions - Screen reader announcements
 */

import { SR_ONLY_STYLES } from '../constants';

type LivePoliteness = 'off' | 'polite' | 'assertive';
type LiveRelevant = 'additions' | 'removals' | 'text' | 'all' | string;

let announceContainer: HTMLElement | null = null;

/**
 * Get or create the hidden announce container
 */
function getAnnounceContainer(): HTMLElement {
  if (announceContainer && document.body.contains(announceContainer)) {
    return announceContainer;
  }

  announceContainer = document.createElement('div');
  announceContainer.setAttribute('aria-live', 'polite');
  announceContainer.setAttribute('aria-atomic', 'true');
  announceContainer.style.cssText = SR_ONLY_STYLES;
  document.body.appendChild(announceContainer);

  return announceContainer;
}

/**
 * Announce a message to screen readers
 */
export function announce(
  message: string,
  options: {
    politeness?: LivePoliteness;
    atomic?: boolean;
    clearAfter?: number;
  } = {}
): void {
  const { politeness = 'polite', atomic = true, clearAfter = 1000 } = options;

  const container = getAnnounceContainer();
  container.setAttribute('aria-live', politeness);
  container.setAttribute('aria-atomic', String(atomic));

  // Clear and set message (triggers announcement)
  container.textContent = '';

  // Use setTimeout to ensure the clear is processed first
  requestAnimationFrame(() => {
    container.textContent = message;

    if (clearAfter > 0) {
      setTimeout(() => {
        container.textContent = '';
      }, clearAfter);
    }
  });
}

/**
 * Announce an assertive message (interrupts current speech)
 */
export function announceAssertive(message: string): void {
  announce(message, { politeness: 'assertive' });
}

/**
 * Announce a polite message (waits for current speech to finish)
 */
export function announcePolite(message: string): void {
  announce(message, { politeness: 'polite' });
}

/**
 * Set aria-live attribute on an element
 */
export function setAriaLive(
  element: HTMLElement,
  politeness: LivePoliteness
): void {
  if (politeness === 'off') {
    element.removeAttribute('aria-live');
  } else {
    element.setAttribute('aria-live', politeness);
  }
}

/**
 * Set aria-atomic attribute
 */
export function setAriaAtomic(element: HTMLElement, atomic: boolean): void {
  element.setAttribute('aria-atomic', String(atomic));
}

/**
 * Set aria-relevant attribute
 */
export function setAriaRelevant(element: HTMLElement, relevant: LiveRelevant): void {
  element.setAttribute('aria-relevant', relevant);
}

/**
 * Create a live region element
 */
export function createLiveRegion(options: {
  politeness?: LivePoliteness;
  atomic?: boolean;
  relevant?: LiveRelevant;
  hidden?: boolean;
} = {}): HTMLElement {
  const {
    politeness = 'polite',
    atomic = true,
    relevant = 'additions text',
    hidden = true,
  } = options;

  const region = document.createElement('div');
  region.setAttribute('aria-live', politeness);
  region.setAttribute('aria-atomic', String(atomic));
  region.setAttribute('aria-relevant', relevant);

  if (hidden) {
    region.style.cssText = SR_ONLY_STYLES;
  }

  return region;
}

/**
 * Make an element a status region (aria-live="polite" + role="status")
 */
export function setAsStatusRegion(element: HTMLElement): void {
  element.setAttribute('role', 'status');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'true');
}

/**
 * Make an element an alert region (aria-live="assertive" + role="alert")
 */
export function setAsAlertRegion(element: HTMLElement): void {
  element.setAttribute('role', 'alert');
  element.setAttribute('aria-live', 'assertive');
  element.setAttribute('aria-atomic', 'true');
}

/**
 * Make an element a log region (aria-live="polite" + role="log")
 */
export function setAsLogRegion(element: HTMLElement): void {
  element.setAttribute('role', 'log');
  element.setAttribute('aria-live', 'polite');
  element.setAttribute('aria-atomic', 'false');
  element.setAttribute('aria-relevant', 'additions');
}
