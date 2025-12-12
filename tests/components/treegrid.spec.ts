/**
 * w-treegrid - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Treegrid/row/gridcell roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-expanded, aria-level, aria-selected
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

// Treegrid uses data-level and data-expanded for hierarchy
// Parent rows have children with higher data-level
const TREEGRID = `
<w-treegrid label="File browser">
  <div slot="row" name="folder1" data-level="1" data-expanded="false">
    <div slot="cell" name="folder1-name">Documents</div>
    <div slot="cell" name="folder1-size">--</div>
  </div>
  <div slot="row" name="file1" data-level="2">
    <div slot="cell" name="file1-name">Report.pdf</div>
    <div slot="cell" name="file1-size">2.5 MB</div>
  </div>
  <div slot="row" name="file2" data-level="1">
    <div slot="cell" name="file2-name">Image.png</div>
    <div slot="cell" name="file2-size">1.2 MB</div>
  </div>
</w-treegrid>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-treegrid", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TREEGRID, "w-treegrid");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-treegrid" });
  });

  test('has role="treegrid"', async ({ page }) => {
    const treegrid = page.locator("w-treegrid");
    await expect(treegrid).toHaveAttribute("role", "treegrid");
  });

  test("has aria-label", async ({ page }) => {
    const treegrid = page.locator("w-treegrid");
    await expect(treegrid).toHaveAttribute("aria-label", "File browser");
  });

  test('rows have role="row"', async ({ page }) => {
    const rows = page.locator('[slot="row"]');
    await expect(rows.first()).toHaveAttribute("role", "row");
  });

  test("rows have aria-level", async ({ page }) => {
    const rows = page.locator('[slot="row"]');
    await expect(rows.first()).toHaveAttribute("aria-level", "1");
  });

  test('cells have role="gridcell"', async ({ page }) => {
    const cells = page.locator('[slot="cell"]');
    await expect(cells.first()).toHaveAttribute("role", "gridcell");
  });

  test("expandable rows have aria-expanded", async ({ page }) => {
    // Row with data-expanded and children (next row with higher level) has aria-expanded
    const expandableRow = page.locator('[slot="row"][name="folder1"]');
    await expect(expandableRow).toHaveAttribute("aria-expanded", "false");
  });

  test("ArrowDown navigates to next visible row", async ({ page }) => {
    const cells = page.locator('[slot="row"]:not([hidden]) [slot="cell"]');

    // Click first cell to set internal state
    await cells.first().click();
    await page.keyboard.press("ArrowDown");

    // Should focus a cell in a visible row (children are hidden when parent collapsed)
    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("role", "gridcell");
  });

  test("expand/collapse row via programmatic API", async ({ page }) => {
    const expandableRow = page.locator('[slot="row"][name="folder1"]');

    // Initially collapsed
    await expect(expandableRow).toHaveAttribute("aria-expanded", "false");

    // Expand via API
    await page.evaluate(() => {
      const treegrid = document.querySelector("w-treegrid") as HTMLElement & { expand: (row: HTMLElement) => void };
      const row = document.querySelector('[slot="row"][name="folder1"]') as HTMLElement;
      treegrid.expand(row);
    });

    await expect(expandableRow).toHaveAttribute("aria-expanded", "true");

    // Collapse via API
    await page.evaluate(() => {
      const treegrid = document.querySelector("w-treegrid") as HTMLElement & { collapse: (row: HTMLElement) => void };
      const row = document.querySelector('[slot="row"][name="folder1"]') as HTMLElement;
      treegrid.collapse(row);
    });

    await expect(expandableRow).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter key selects non-expandable row", async ({ page }) => {
    const rows = page.locator('[slot="row"]:not([hidden])');
    // Last visible row (file2 at level 1)
    const leafRow = rows.last();
    const firstCell = leafRow.locator('[slot="cell"]').first();

    await firstCell.click();
    await page.keyboard.press("Enter");

    await expect(leafRow).toHaveAttribute("aria-selected", "true");
  });
});
