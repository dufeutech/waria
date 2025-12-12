/**
 * ARIA Relationships - Managing aria-controls, aria-labelledby, etc.
 */

import { ensureId } from './id';

/**
 * Set aria-controls to link an element to what it controls
 */
export function setAriaControls(
  controller: HTMLElement,
  controlled: HTMLElement | HTMLElement[]
): void {
  const targets = Array.isArray(controlled) ? controlled : [controlled];
  const ids = targets.map((el) => ensureId(el)).join(' ');
  controller.setAttribute('aria-controls', ids);
}

/**
 * Remove aria-controls attribute
 */
export function removeAriaControls(element: HTMLElement): void {
  element.removeAttribute('aria-controls');
}

/**
 * Set aria-labelledby to link an element to its label(s)
 */
export function setAriaLabelledBy(
  element: HTMLElement,
  labels: HTMLElement | HTMLElement[]
): void {
  const targets = Array.isArray(labels) ? labels : [labels];
  const ids = targets.map((el) => ensureId(el)).join(' ');
  element.setAttribute('aria-labelledby', ids);
}

/**
 * Set aria-label for a direct label
 */
export function setAriaLabel(element: HTMLElement, label: string): void {
  element.setAttribute('aria-label', label);
}

/**
 * Remove aria-labelledby attribute
 */
export function removeAriaLabelledBy(element: HTMLElement): void {
  element.removeAttribute('aria-labelledby');
}

/**
 * Set aria-describedby to link an element to its description(s)
 */
export function setAriaDescribedBy(
  element: HTMLElement,
  descriptions: HTMLElement | HTMLElement[]
): void {
  const targets = Array.isArray(descriptions) ? descriptions : [descriptions];
  const ids = targets.map((el) => ensureId(el)).join(' ');
  element.setAttribute('aria-describedby', ids);
}

/**
 * Remove aria-describedby attribute
 */
export function removeAriaDescribedBy(element: HTMLElement): void {
  element.removeAttribute('aria-describedby');
}

/**
 * Set aria-owns to indicate ownership relationship
 */
export function setAriaOwns(
  owner: HTMLElement,
  owned: HTMLElement | HTMLElement[]
): void {
  const targets = Array.isArray(owned) ? owned : [owned];
  const ids = targets.map((el) => ensureId(el)).join(' ');
  owner.setAttribute('aria-owns', ids);
}

/**
 * Remove aria-owns attribute
 */
export function removeAriaOwns(element: HTMLElement): void {
  element.removeAttribute('aria-owns');
}

/**
 * Set aria-flowto to indicate reading order
 */
export function setAriaFlowTo(
  element: HTMLElement,
  next: HTMLElement | HTMLElement[]
): void {
  const targets = Array.isArray(next) ? next : [next];
  const ids = targets.map((el) => ensureId(el)).join(' ');
  element.setAttribute('aria-flowto', ids);
}

/**
 * Remove aria-flowto attribute
 */
export function removeAriaFlowTo(element: HTMLElement): void {
  element.removeAttribute('aria-flowto');
}

/**
 * Set aria-details to link to detailed information
 */
export function setAriaDetails(element: HTMLElement, details: HTMLElement): void {
  element.setAttribute('aria-details', ensureId(details));
}

/**
 * Remove aria-details attribute
 */
export function removeAriaDetails(element: HTMLElement): void {
  element.removeAttribute('aria-details');
}

/**
 * Set aria-errormessage to link to error message element
 */
export function setAriaErrorMessage(element: HTMLElement, errorEl: HTMLElement): void {
  element.setAttribute('aria-errormessage', ensureId(errorEl));
}

/**
 * Remove aria-errormessage attribute
 */
export function removeAriaErrorMessage(element: HTMLElement): void {
  element.removeAttribute('aria-errormessage');
}

/**
 * Link a trigger to its content with appropriate ARIA relationships
 */
export function linkTriggerToContent(
  trigger: HTMLElement,
  content: HTMLElement,
  options: {
    controls?: boolean;
    labelledBy?: boolean;
    describedBy?: boolean;
  } = {}
): void {
  const { controls = true, labelledBy = false, describedBy = false } = options;

  if (controls) {
    setAriaControls(trigger, content);
  }

  if (labelledBy) {
    setAriaLabelledBy(content, trigger);
  }

  if (describedBy) {
    setAriaDescribedBy(content, trigger);
  }
}
