/**
 * ARIA Attributes - Setters for ARIA state attributes
 */

/**
 * Set aria-expanded attribute
 */
export function setAriaExpanded(element: HTMLElement, expanded: boolean): void {
  element.setAttribute('aria-expanded', String(expanded));
}

/**
 * Set aria-selected attribute
 */
export function setAriaSelected(element: HTMLElement, selected: boolean): void {
  element.setAttribute('aria-selected', String(selected));
}

/**
 * Set aria-checked attribute
 */
export function setAriaChecked(element: HTMLElement, checked: boolean | 'mixed'): void {
  element.setAttribute('aria-checked', String(checked));
}

/**
 * Set aria-pressed attribute (for toggle buttons)
 */
export function setAriaPressed(element: HTMLElement, pressed: boolean | 'mixed'): void {
  element.setAttribute('aria-pressed', String(pressed));
}

/**
 * Set aria-disabled attribute
 */
export function setAriaDisabled(element: HTMLElement, disabled: boolean): void {
  element.setAttribute('aria-disabled', String(disabled));
}

/**
 * Set aria-hidden attribute
 */
export function setAriaHidden(element: HTMLElement, hidden: boolean): void {
  element.setAttribute('aria-hidden', String(hidden));
}

/**
 * Set aria-current attribute
 */
export function setAriaCurrent(
  element: HTMLElement,
  current: boolean | 'page' | 'step' | 'location' | 'date' | 'time'
): void {
  if (current === false) {
    element.removeAttribute('aria-current');
  } else {
    element.setAttribute('aria-current', String(current));
  }
}

/**
 * Set aria-invalid attribute
 */
export function setAriaInvalid(
  element: HTMLElement,
  invalid: boolean | 'grammar' | 'spelling'
): void {
  if (invalid === false) {
    element.removeAttribute('aria-invalid');
  } else {
    element.setAttribute('aria-invalid', String(invalid));
  }
}

/**
 * Set aria-busy attribute
 */
export function setAriaBusy(element: HTMLElement, busy: boolean): void {
  element.setAttribute('aria-busy', String(busy));
}

/**
 * Set aria-haspopup attribute
 */
export function setAriaHasPopup(
  element: HTMLElement,
  popup: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
): void {
  if (popup === false) {
    element.removeAttribute('aria-haspopup');
  } else {
    element.setAttribute('aria-haspopup', String(popup));
  }
}

/**
 * Set aria-level attribute (for headings, tree items)
 */
export function setAriaLevel(element: HTMLElement, level: number): void {
  element.setAttribute('aria-level', String(level));
}

/**
 * Set aria-posinset and aria-setsize for list items
 */
export function setAriaPosition(
  element: HTMLElement,
  position: number,
  setSize: number
): void {
  element.setAttribute('aria-posinset', String(position));
  element.setAttribute('aria-setsize', String(setSize));
}

/**
 * Set aria-valuemin, aria-valuemax, aria-valuenow for range widgets
 */
export function setAriaValue(
  element: HTMLElement,
  value: number,
  min: number,
  max: number,
  text?: string
): void {
  element.setAttribute('aria-valuenow', String(value));
  element.setAttribute('aria-valuemin', String(min));
  element.setAttribute('aria-valuemax', String(max));
  if (text) {
    element.setAttribute('aria-valuetext', text);
  }
}

/**
 * Set aria-orientation attribute
 */
export function setAriaOrientation(
  element: HTMLElement,
  orientation: 'horizontal' | 'vertical'
): void {
  element.setAttribute('aria-orientation', orientation);
}

/**
 * Set aria-multiselectable attribute
 */
export function setAriaMultiselectable(element: HTMLElement, multi: boolean): void {
  element.setAttribute('aria-multiselectable', String(multi));
}

/**
 * Set aria-required attribute
 */
export function setAriaRequired(element: HTMLElement, required: boolean): void {
  element.setAttribute('aria-required', String(required));
}

/**
 * Set aria-readonly attribute
 */
export function setAriaReadonly(element: HTMLElement, readonly: boolean): void {
  element.setAttribute('aria-readonly', String(readonly));
}

/**
 * Set aria-activedescendant attribute
 */
export function setAriaActiveDescendant(element: HTMLElement, id: string | null): void {
  if (id) {
    element.setAttribute('aria-activedescendant', id);
  } else {
    element.removeAttribute('aria-activedescendant');
  }
}

/**
 * Set tabindex attribute
 */
export function setTabIndex(element: HTMLElement, index: number): void {
  element.setAttribute('tabindex', String(index));
}
