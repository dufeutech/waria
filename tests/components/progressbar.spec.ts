/**
 * w-progressbar - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper progressbar role
 * - 4.1.2 Name, Role, Value: aria-valuenow/min/max
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const PROGRESSBAR = `
<w-progressbar value="50" min="0" max="100" label="Loading progress">
  <div slot="track"></div>
  <div slot="fill"></div>
</w-progressbar>`;

const PROGRESSBAR_INDETERMINATE = `
<w-progressbar indeterminate label="Loading...">
  <div slot="track"></div>
  <div slot="fill"></div>
</w-progressbar>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-progressbar", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, PROGRESSBAR, "w-progressbar");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-progressbar" });
  });

  test('has role="progressbar"', async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    await expect(progressbar).toHaveAttribute("role", "progressbar");
  });

  test("has aria-valuenow", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    await expect(progressbar).toHaveAttribute("aria-valuenow", "50");
  });

  test("has aria-valuemin", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    await expect(progressbar).toHaveAttribute("aria-valuemin", "0");
  });

  test("has aria-valuemax", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    await expect(progressbar).toHaveAttribute("aria-valuemax", "100");
  });

  test("has aria-label", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    const label = await progressbar.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test("aria-valuenow updates with value", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");

    await progressbar.evaluate((el: HTMLElement & { value: number }) => {
      el.value = 75;
    });

    await expect(progressbar).toHaveAttribute("aria-valuenow", "75");
  });
});

test.describe("w-progressbar indeterminate", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, PROGRESSBAR_INDETERMINATE, "w-progressbar");
  });

  test("does not have aria-valuenow", async ({ page }) => {
    const progressbar = page.locator("w-progressbar");
    const valuenow = await progressbar.getAttribute("aria-valuenow");
    expect(valuenow).toBeNull();
  });
});
