/**
 * Shared Test Utilities
 * DRY helpers for component testing - WCAG 2.1 AA compliance focus
 *
 * Principles:
 * - DRY: Reusable helpers for common test patterns
 * - SoC: Each helper has a single purpose
 * - Composable: Helpers combine without side effects
 */

import { Page, Locator, expect } from "@playwright/test";

// Re-export library constants for tests
export { SLOT, KEY, ARIA, BOOL } from "../src/constants";

// ═══════════════════════════════════════════════════════════════════════════
// Fixture Rendering - Component testing via test page
// ═══════════════════════════════════════════════════════════════════════════

/** Navigate to test page and inject HTML fixture */
export async function render(page: Page, html: string): Promise<void> {
  await page.goto("/tests-runner.html");
  // Wait for the library to register custom elements
  await page.waitForFunction(() => customElements.get("w-tabs") !== undefined, {
    timeout: 5000,
  });
  await page.locator("#test-root").evaluate((el, content) => {
    el.innerHTML = content;
  }, html);
}

/** Wait for component to initialize (checks for ARIA attribute) */
export async function waitForInit(
  page: Page,
  selector: string,
  checkAttr = "role"
): Promise<void> {
  await page.waitForFunction(
    ({ sel, attr }) => {
      const el = document.querySelector(sel);
      return el?.hasAttribute(attr) || el?.querySelector(`[${attr}]`) !== null;
    },
    { sel: selector, attr: checkAttr },
    { timeout: 5000 }
  );
}

/** Render and wait for component initialization */
export async function renderComponent(
  page: Page,
  html: string,
  selector: string,
  checkAttr = "role"
): Promise<void> {
  await render(page, html);
  await waitForInit(page, selector, checkAttr);
}

// ═══════════════════════════════════════════════════════════════════════════
// ARIA Attribute Assertions - WCAG compliance helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Assert element has expected role */
export const expectRole = (locator: Locator, role: string) =>
  expect(locator).toHaveAttribute("role", role);

/** Assert element is labeled (WCAG 1.3.1, 4.1.2) */
export async function expectLabeled(locator: Locator): Promise<void> {
  const label = await locator.getAttribute("aria-label");
  const labelledby = await locator.getAttribute("aria-labelledby");
  expect(label || labelledby).toBeTruthy();
}

/** Assert aria-expanded state */
export const expectExpanded = (locator: Locator, expanded: boolean) =>
  expect(locator).toHaveAttribute("aria-expanded", String(expanded));

/** Assert aria-selected state */
export const expectSelected = (locator: Locator, selected: boolean) =>
  expect(locator).toHaveAttribute("aria-selected", String(selected));

/** Assert aria-checked state */
export const expectChecked = (
  locator: Locator,
  checked: boolean | "mixed"
) =>
  expect(locator).toHaveAttribute(
    "aria-checked",
    checked === "mixed" ? "mixed" : String(checked)
  );

/** Assert aria-pressed state */
export const expectPressed = (locator: Locator, pressed: boolean) =>
  expect(locator).toHaveAttribute("aria-pressed", String(pressed));

/** Assert aria-disabled state */
export async function expectDisabled(
  locator: Locator,
  disabled: boolean
): Promise<void> {
  if (disabled) {
    await expect(locator).toHaveAttribute("aria-disabled", "true");
  } else {
    const attr = await locator.getAttribute("aria-disabled");
    expect(attr === null || attr === "false").toBeTruthy();
  }
}

/** Assert aria-current state */
export async function expectCurrent(
  locator: Locator,
  value: string | null
): Promise<void> {
  if (value) {
    await expect(locator).toHaveAttribute("aria-current", value);
  } else {
    expect(await locator.getAttribute("aria-current")).toBeNull();
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// Keyboard Navigation - WCAG 2.1.1 compliance
// ═══════════════════════════════════════════════════════════════════════════

/** Press key and verify focus moved */
export async function pressAndExpectFocus(
  page: Page,
  key: string,
  expected: Locator
): Promise<void> {
  await page.keyboard.press(key);
  await expect(expected).toBeFocused();
}

/** Focus element and press key */
export async function focusAndPress(
  locator: Locator,
  page: Page,
  key: string
): Promise<void> {
  await locator.focus();
  await page.keyboard.press(key);
}

/** Test arrow key navigation (WCAG 2.1.1) */
export async function testArrowNav(
  page: Page,
  items: Locator,
  opts: { horizontal?: boolean; wrap?: boolean } = {}
): Promise<void> {
  const { horizontal = true, wrap = false } = opts;
  const fwdKey = horizontal ? "ArrowRight" : "ArrowDown";
  const backKey = horizontal ? "ArrowLeft" : "ArrowUp";

  const count = await items.count();
  if (count < 2) return;

  await items.first().focus();
  await expect(items.first()).toBeFocused();

  await page.keyboard.press(fwdKey);
  await expect(items.nth(1)).toBeFocused();

  await page.keyboard.press(backKey);
  await expect(items.first()).toBeFocused();

  if (wrap) {
    await page.keyboard.press(backKey);
    await expect(items.last()).toBeFocused();
  }
}

/** Test Home/End navigation */
export async function testHomeEnd(page: Page, items: Locator): Promise<void> {
  const count = await items.count();
  if (count < 2) return;

  await items.first().focus();
  await page.keyboard.press("End");
  await expect(items.last()).toBeFocused();

  await page.keyboard.press("Home");
  await expect(items.first()).toBeFocused();
}

// ═══════════════════════════════════════════════════════════════════════════
// Event Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Listen for custom event and return detail */
export async function listenForEvent<T = unknown>(
  locator: Locator,
  eventName: string,
  action: () => Promise<void>
): Promise<T> {
  const eventPromise = locator.evaluate(
    (el, name) =>
      new Promise<T>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error(`Event ${name} not fired`)), 5000);
        el.addEventListener(name, (e: Event) => {
          clearTimeout(timeout);
          resolve((e as CustomEvent).detail);
        }, { once: true });
      }),
    eventName
  );
  await action();
  return eventPromise;
}

// ═══════════════════════════════════════════════════════════════════════════
// Value Helpers - For range/spinbutton components
// ═══════════════════════════════════════════════════════════════════════════

/** Get numeric ARIA value */
export async function getAriaValue(
  locator: Locator,
  attr: "valuenow" | "valuemin" | "valuemax"
): Promise<number> {
  return Number(await locator.getAttribute(`aria-${attr}`));
}

/** Assert value changed in expected direction */
export async function expectValueChange(
  locator: Locator,
  action: () => Promise<void>,
  direction: "increase" | "decrease"
): Promise<void> {
  const before = await getAriaValue(locator, "valuenow");
  await action();
  const after = await getAriaValue(locator, "valuenow");
  direction === "increase"
    ? expect(after).toBeGreaterThan(before)
    : expect(after).toBeLessThan(before);
}

// ═══════════════════════════════════════════════════════════════════════════
// Slot Helpers
// ═══════════════════════════════════════════════════════════════════════════

/** Get slotted elements */
export const getSlot = (parent: Locator, slot: string): Locator =>
  parent.locator(slot.startsWith("[") ? slot : `[slot="${slot}"]`);

/** Check if element exists */
export async function exists(locator: Locator): Promise<boolean> {
  return (await locator.count()) > 0;
}
