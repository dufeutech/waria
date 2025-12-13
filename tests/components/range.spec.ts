/**
 * w-range - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper slider role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-valuenow/min/max
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const RANGE = `
<w-range min="0" max="100" value="50" label="Volume">
  <w-slot rail><div></div></w-slot>
  <w-slot fill><div></div></w-slot>
  <w-slot knob><div></div></w-slot>
</w-range>`;

const RANGE_VERTICAL = `
<w-range min="0" max="100" value="50" orientation="vertical" label="Volume">
  <w-slot rail><div></div></w-slot>
  <w-slot fill><div></div></w-slot>
  <w-slot knob><div></div></w-slot>
</w-range>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-range", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, RANGE, "w-range");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-range" });
  });

  test("thumb has correct ARIA attributes", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await expect(thumb).toHaveAttribute("role", "slider");
    await expect(thumb).toHaveAttribute("aria-valuemin", "0");
    await expect(thumb).toHaveAttribute("aria-valuemax", "100");
    await expect(thumb).toHaveAttribute("aria-valuenow", "50");
    await expect(thumb).toHaveAttribute("tabindex", "0");
  });

  test("ArrowRight increments value", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    const initialValue = Number(await thumb.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowRight");
    const newValue = Number(await thumb.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("ArrowLeft decrements value", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    const initialValue = Number(await thumb.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowLeft");
    const newValue = Number(await thumb.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });

  test("Home key sets to min", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    await page.keyboard.press("Home");

    await expect(thumb).toHaveAttribute("aria-valuenow", "0");
  });

  test("End key sets to max", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    await page.keyboard.press("End");

    await expect(thumb).toHaveAttribute("aria-valuenow", "100");
  });

});

test.describe("w-range vertical", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, RANGE_VERTICAL, "w-range");
  });

  test("has vertical orientation", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');
    await expect(thumb).toHaveAttribute("aria-orientation", "vertical");
  });

  test("ArrowUp increments value", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    const initialValue = Number(await thumb.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowUp");
    const newValue = Number(await thumb.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("ArrowDown decrements value", async ({ page }) => {
    const thumb = page.locator('w-slot[knob] > *');

    await thumb.focus();
    const initialValue = Number(await thumb.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowDown");
    const newValue = Number(await thumb.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });
});
