/**
 * Shared Test Utilities
 * DRY helpers for component testing using library constants
 */

import { Page, Locator, expect } from "@playwright/test";

// Re-export library constants for tests
export { SLOT, KEY, ARIA, BOOL } from "../src/constants";

// ─────────────────────────────────────────────────────────────
// Route helpers - consistent navigation
// ─────────────────────────────────────────────────────────────

/** Navigate to a component example page using hash routing */
export const gotoComponent = async (
  page: Page,
  component: string
): Promise<void> => {
  // Ensure first letter is capitalized for route consistency
  const route = component.charAt(0).toUpperCase() + component.slice(1);
  await page.goto(`/#/${route}`, { waitUntil: "domcontentloaded" });
};

/** Wait for a component to be visible on the page
 * Uses a child selector when provided - more reliable with Alpine.js
 * which controls section visibility via x-show
 */
export const waitForComponent = async (
  page: Page,
  tag: string,
  childSelector?: string
): Promise<Locator> => {
  const locator = page.locator(tag).first();
  const waitSelector = childSelector ? `${tag} ${childSelector}` : tag;
  await page.waitForSelector(waitSelector, { state: "visible", timeout: 10000 });
  return locator;
};

/** Navigate to component page and wait for it to be visible */
export const setupComponent = async (
  page: Page,
  component: string,
  tag?: string
): Promise<Locator> => {
  await gotoComponent(page, component);
  return waitForComponent(page, tag ?? `w-${component.toLowerCase()}`);
};

// ─────────────────────────────────────────────────────────────
// ARIA attribute helpers
// ─────────────────────────────────────────────────────────────

/** Assert element has expected role */
export const expectRole = async (
  locator: Locator,
  role: string
): Promise<void> => {
  await expect(locator).toHaveAttribute("role", role);
};

/** Assert element has aria-label or aria-labelledby */
export const expectLabeled = async (locator: Locator): Promise<void> => {
  const label = await locator.getAttribute("aria-label");
  const labelledby = await locator.getAttribute("aria-labelledby");
  expect(label || labelledby).toBeTruthy();
};

/** Assert aria-expanded state */
export const expectExpanded = async (
  locator: Locator,
  expanded: boolean
): Promise<void> => {
  await expect(locator).toHaveAttribute(
    "aria-expanded",
    expanded ? "true" : "false"
  );
};

/** Assert aria-selected state */
export const expectSelected = async (
  locator: Locator,
  selected: boolean
): Promise<void> => {
  await expect(locator).toHaveAttribute(
    "aria-selected",
    selected ? "true" : "false"
  );
};

/** Assert aria-checked state */
export const expectChecked = async (
  locator: Locator,
  checked: boolean | "mixed"
): Promise<void> => {
  const value = checked === "mixed" ? "mixed" : checked ? "true" : "false";
  await expect(locator).toHaveAttribute("aria-checked", value);
};

/** Assert aria-pressed state */
export const expectPressed = async (
  locator: Locator,
  pressed: boolean
): Promise<void> => {
  await expect(locator).toHaveAttribute(
    "aria-pressed",
    pressed ? "true" : "false"
  );
};

/** Assert aria-disabled state */
export const expectDisabled = async (
  locator: Locator,
  disabled: boolean
): Promise<void> => {
  if (disabled) {
    await expect(locator).toHaveAttribute("aria-disabled", "true");
  } else {
    const attr = await locator.getAttribute("aria-disabled");
    expect(attr === null || attr === "false").toBeTruthy();
  }
};

/** Assert aria-current state */
export const expectCurrent = async (
  locator: Locator,
  value: string | null
): Promise<void> => {
  if (value) {
    await expect(locator).toHaveAttribute("aria-current", value);
  } else {
    const attr = await locator.getAttribute("aria-current");
    expect(attr).toBeNull();
  }
};

// ─────────────────────────────────────────────────────────────
// Keyboard interaction helpers
// ─────────────────────────────────────────────────────────────

/** Press a key and verify focus moved to expected element */
export const pressKeyAndExpectFocus = async (
  page: Page,
  key: string,
  expectedFocused: Locator
): Promise<void> => {
  await page.keyboard.press(key);
  await expect(expectedFocused).toBeFocused();
};

/** Focus element and press key */
export const focusAndPress = async (
  locator: Locator,
  page: Page,
  key: string
): Promise<void> => {
  await locator.focus();
  await page.keyboard.press(key);
};

/** Test arrow key navigation between items */
export const testArrowNavigation = async (
  page: Page,
  items: Locator,
  config: {
    horizontal?: boolean;
    wrap?: boolean;
  } = {}
): Promise<void> => {
  const { horizontal = true, wrap = false } = config;
  const forwardKey = horizontal ? "ArrowRight" : "ArrowDown";
  const backwardKey = horizontal ? "ArrowLeft" : "ArrowUp";

  const count = await items.count();
  if (count < 2) return;

  await items.first().focus();
  await expect(items.first()).toBeFocused();

  // Forward navigation
  await page.keyboard.press(forwardKey);
  await expect(items.nth(1)).toBeFocused();

  // Backward navigation
  await page.keyboard.press(backwardKey);
  await expect(items.first()).toBeFocused();

  // Wrap behavior
  if (wrap) {
    await page.keyboard.press(backwardKey);
    await expect(items.last()).toBeFocused();
  }
};

/** Test Home/End key navigation */
export const testHomeEndNavigation = async (
  page: Page,
  items: Locator
): Promise<void> => {
  const count = await items.count();
  if (count < 2) return;

  await items.first().focus();

  await page.keyboard.press("End");
  await expect(items.last()).toBeFocused();

  await page.keyboard.press("Home");
  await expect(items.first()).toBeFocused();
};

// ─────────────────────────────────────────────────────────────
// Event helpers
// ─────────────────────────────────────────────────────────────

/** Listen for custom event and return detail */
export const listenForEvent = async <T = unknown>(
  locator: Locator,
  eventName: string,
  action: () => Promise<void>,
  timeout = 5000
): Promise<T> => {
  const eventPromise = locator.evaluate(
    (el, name) =>
      new Promise<T>((resolve, reject) => {
        const timeoutId = setTimeout(
          () => reject(new Error(`Event ${name} not fired`)),
          5000
        );
        el.addEventListener(
          name,
          (e: Event) => {
            clearTimeout(timeoutId);
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      }),
    eventName
  );

  await action();
  return eventPromise;
};

// ─────────────────────────────────────────────────────────────
// Value helpers for range/spinbutton components
// ─────────────────────────────────────────────────────────────

/** Get numeric ARIA value */
export const getAriaValue = async (
  locator: Locator,
  attr: "valuenow" | "valuemin" | "valuemax"
): Promise<number> => {
  const value = await locator.getAttribute(`aria-${attr}`);
  return Number(value);
};

/** Assert value changed in expected direction */
export const expectValueChange = async (
  locator: Locator,
  action: () => Promise<void>,
  direction: "increase" | "decrease"
): Promise<void> => {
  const before = await getAriaValue(locator, "valuenow");
  await action();
  const after = await getAriaValue(locator, "valuenow");

  if (direction === "increase") {
    expect(after).toBeGreaterThan(before);
  } else {
    expect(after).toBeLessThan(before);
  }
};

/** Assert value equals min or max */
export const expectValueAtBound = async (
  locator: Locator,
  bound: "min" | "max"
): Promise<void> => {
  const value = await getAriaValue(locator, "valuenow");
  const boundValue = await getAriaValue(
    locator,
    bound === "min" ? "valuemin" : "valuemax"
  );
  expect(value).toBe(boundValue);
};

// ─────────────────────────────────────────────────────────────
// Component-specific helpers
// ─────────────────────────────────────────────────────────────

/** Get slotted elements */
export const getSlot = (parent: Locator, slot: string): Locator => {
  // Handle both raw slot name and [slot="name"] format
  const selector = slot.startsWith("[") ? slot : `[slot="${slot}"]`;
  return parent.locator(selector);
};

/** Skip test if element not found */
export const skipIfMissing = async (locator: Locator): Promise<boolean> => {
  const count = await locator.count();
  return count === 0;
};
