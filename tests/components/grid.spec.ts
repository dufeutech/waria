/**
 * w-grid - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Grid/row/gridcell roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-selected state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const GRID = `
<w-grid label="Data grid">
  <w-slot row name="1"><div>
    <w-slot cell name="1-1"><div>Cell 1-1</div></w-slot>
    <w-slot cell name="1-2"><div>Cell 1-2</div></w-slot>
    <w-slot cell name="1-3"><div>Cell 1-3</div></w-slot>
  </div></w-slot>
  <w-slot row name="2"><div>
    <w-slot cell name="2-1"><div>Cell 2-1</div></w-slot>
    <w-slot cell name="2-2"><div>Cell 2-2</div></w-slot>
    <w-slot cell name="2-3"><div>Cell 2-3</div></w-slot>
  </div></w-slot>
</w-grid>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-grid", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, GRID, "w-grid");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-grid" });
  });

  test('has role="grid"', async ({ page }) => {
    const grid = page.locator("w-grid");
    await expect(grid).toHaveAttribute("role", "grid");
  });

  test("has aria-label", async ({ page }) => {
    const grid = page.locator("w-grid");
    await expect(grid).toHaveAttribute("aria-label", "Data grid");
  });

  test('rows have role="row"', async ({ page }) => {
    const rows = page.locator('w-slot[row] > *');
    await expect(rows.first()).toHaveAttribute("role", "row");
  });

  test('cells have role="gridcell"', async ({ page }) => {
    const cells = page.locator('w-slot[cell] > *');
    await expect(cells.first()).toHaveAttribute("role", "gridcell");
  });

  test("ArrowRight navigates to next cell", async ({ page }) => {
    const cells = page.locator('w-slot[cell] > *');

    await cells.first().focus();
    await page.keyboard.press("ArrowRight");

    await expect(cells.nth(1)).toBeFocused();
  });

  test("ArrowLeft navigates to previous cell", async ({ page }) => {
    const cells = page.locator('w-slot[cell] > *');

    // First click on cell to set internal index
    await cells.nth(1).click();
    await page.keyboard.press("ArrowLeft");

    await expect(cells.first()).toBeFocused();
  });

  test("Home/End keys navigate to first/last cell in row", async ({ page }) => {
    const cells = page.locator('w-slot[cell] > *');

    // Click first cell to set internal index
    await cells.first().click();
    await page.keyboard.press("End");

    // Third cell (last in row)
    await expect(cells.nth(2)).toBeFocused();

    await page.keyboard.press("Home");
    await expect(cells.first()).toBeFocused();
  });

  test("Enter key selects cell", async ({ page }) => {
    const cell = page.locator('w-slot[cell] > *').first();

    await cell.click();
    await page.keyboard.press("Enter");

    await expect(cell).toHaveAttribute("aria-selected", "true");
  });
});
