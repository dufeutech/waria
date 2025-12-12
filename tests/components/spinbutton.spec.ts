/**
 * w-spinbutton - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper spinbutton role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-valuenow/min/max
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SPINBUTTON = `
<w-spinbutton min="0" max="100" value="50" step="1" label="Quantity">
  <button slot="decrement">-</button>
  <input slot="input" type="text" />
  <button slot="increment">+</button>
</w-spinbutton>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-spinbutton", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SPINBUTTON, "w-spinbutton");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-spinbutton" });
  });

  test("input has correct ARIA attributes", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await expect(input).toHaveAttribute("role", "spinbutton");
    await expect(input).toHaveAttribute("aria-valuemin", "0");
    await expect(input).toHaveAttribute("aria-valuemax", "100");
    await expect(input).toHaveAttribute("aria-valuenow", "50");
  });

  test("ArrowUp increments value", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await input.focus();
    const initialValue = Number(await input.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowUp");
    const newValue = Number(await input.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("ArrowDown decrements value", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await input.focus();
    const initialValue = Number(await input.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowDown");
    const newValue = Number(await input.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });

  test("Home key sets to min", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await input.focus();
    await page.keyboard.press("Home");

    await expect(input).toHaveAttribute("aria-valuenow", "0");
  });

  test("End key sets to max", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await input.focus();
    await page.keyboard.press("End");

    await expect(input).toHaveAttribute("aria-valuenow", "100");
  });

  test("increment button increases value", async ({ page }) => {
    const input = page.locator('[slot="input"]');
    const incrementBtn = page.locator('[slot="increment"]');

    const initialValue = Number(await input.getAttribute("aria-valuenow"));
    await incrementBtn.click();
    const newValue = Number(await input.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("decrement button decreases value", async ({ page }) => {
    const input = page.locator('[slot="input"]');
    const decrementBtn = page.locator('[slot="decrement"]');

    const initialValue = Number(await input.getAttribute("aria-valuenow"));
    await decrementBtn.click();
    const newValue = Number(await input.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });

  test("PageUp increments by larger step", async ({ page }) => {
    const input = page.locator('[slot="input"]');

    await input.focus();
    const initialValue = Number(await input.getAttribute("aria-valuenow"));

    await page.keyboard.press("PageUp");
    const newValue = Number(await input.getAttribute("aria-valuenow"));

    expect(newValue - initialValue).toBeGreaterThan(1);
  });
});
