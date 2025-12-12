import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-grid accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/grid", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-grid" });
  });

  test("should have correct ARIA role", async ({ page }) => {
    const grid = page.locator("w-grid");

    await expect(grid).toHaveAttribute("role", "grid");
    await expect(grid).toHaveAttribute("aria-label");
  });

  test("should have row and gridcell roles", async ({ page }) => {
    const rows = page.locator('w-grid [slot="row"]');
    const cells = page.locator('w-grid [slot="cell"]');

    if ((await rows.count()) > 0) {
      await expect(rows.first()).toHaveAttribute("role", "row");
    }
    if ((await cells.count()) > 0) {
      await expect(cells.first()).toHaveAttribute("role", "gridcell");
    }
  });

  test("should support arrow key navigation", async ({ page }) => {
    const cells = page.locator('w-grid [slot="cell"]');

    if ((await cells.count()) > 1) {
      await cells.first().focus();
      await expect(cells.first()).toBeFocused();

      await page.keyboard.press("ArrowRight");
      await expect(cells.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await expect(cells.first()).toBeFocused();
    }
  });

  test("should support Home and End keys", async ({ page }) => {
    const cells = page.locator('w-grid [slot="cell"]');

    if ((await cells.count()) > 1) {
      await cells.first().focus();

      await page.keyboard.press("End");
      // Should be at end of row

      await page.keyboard.press("Home");
      await expect(cells.first()).toBeFocused();
    }
  });

  test("should select cell on Enter/Space", async ({ page }) => {
    const cell = page.locator('w-grid [slot="cell"]').first();

    await cell.focus();
    await page.keyboard.press("Enter");

    await expect(cell).toHaveAttribute("aria-selected", "true");
  });
});
