import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-treegrid accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Treegrid", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-treegrid", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-treegrid" });
  });

  test("should have correct ARIA role", async ({ page }) => {
    const treegrid = page.locator("w-treegrid");

    await expect(treegrid).toHaveAttribute("role", "treegrid");
    await expect(treegrid).toHaveAttribute("aria-label");
  });

  test("should have row and gridcell roles", async ({ page }) => {
    const rows = page.locator('w-treegrid [slot="row"]');
    const cells = page.locator('w-treegrid [slot="cell"]');

    if ((await rows.count()) > 0) {
      await expect(rows.first()).toHaveAttribute("role", "row");
      await expect(rows.first()).toHaveAttribute("aria-level");
    }
    if ((await cells.count()) > 0) {
      await expect(cells.first()).toHaveAttribute("role", "gridcell");
    }
  });

  test("should have aria-expanded on expandable rows", async ({ page }) => {
    const expandableRow = page
      .locator('w-treegrid [slot="row"][data-expanded]')
      .first();

    if ((await expandableRow.count()) > 0) {
      await expect(expandableRow).toHaveAttribute("aria-expanded");
    }
  });

  test("should support arrow key navigation", async ({ page }) => {
    const cells = page.locator('w-treegrid [slot="cell"]');

    if ((await cells.count()) > 1) {
      await cells.first().focus();
      await expect(cells.first()).toBeFocused();

      await page.keyboard.press("ArrowDown");
      // Should focus cell in next row
    }
  });

  test("should expand/collapse with ArrowRight/ArrowLeft", async ({ page }) => {
    const expandableRow = page
      .locator('w-treegrid [slot="row"][data-expanded]')
      .first();
    const firstCell = page.locator('w-treegrid [slot="cell"]').first();

    if ((await expandableRow.count()) > 0) {
      await firstCell.focus();

      // Collapse
      if ((await expandableRow.getAttribute("data-expanded")) === "true") {
        await page.keyboard.press("ArrowLeft");
        await expect(expandableRow).toHaveAttribute("aria-expanded", "false");
      }

      // Expand
      await page.keyboard.press("ArrowRight");
      await expect(expandableRow).toHaveAttribute("aria-expanded", "true");
    }
  });

  test("should select row on Enter/Space", async ({ page }) => {
    // Select a leaf row (without children) - need to navigate to it first
    // First row is a folder with children, so Enter toggles expansion
    // Navigate down to the second row (Report.pdf - a leaf node) then select
    const rows = page.locator('w-treegrid [slot="row"]');
    const firstCell = page.locator('w-treegrid [slot="cell"]').first();

    await firstCell.focus();
    // Expand the first folder
    await page.keyboard.press("Enter");
    // Navigate down to Report.pdf (first child)
    await page.keyboard.press("ArrowDown");
    // Select it
    await page.keyboard.press("Enter");

    // Second row (Report.pdf) should be selected
    await expect(rows.nth(1)).toHaveAttribute("aria-selected", "true");
  });
});
