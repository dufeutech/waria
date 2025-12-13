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
  <w-slot row name="folder1"><div data-level="1" data-expanded="false">
    <w-slot cell name="folder1-name"><div>Documents</div></w-slot>
    <w-slot cell name="folder1-size"><div>--</div></w-slot>
  </div></w-slot>
  <w-slot row name="file1"><div data-level="2">
    <w-slot cell name="file1-name"><div>Report.pdf</div></w-slot>
    <w-slot cell name="file1-size"><div>2.5 MB</div></w-slot>
  </div></w-slot>
  <w-slot row name="file2"><div data-level="1">
    <w-slot cell name="file2-name"><div>Image.png</div></w-slot>
    <w-slot cell name="file2-size"><div>1.2 MB</div></w-slot>
  </div></w-slot>
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
    const rows = page.locator('w-slot[row] > *');
    await expect(rows.first()).toHaveAttribute("role", "row");
  });

  test("rows have aria-level", async ({ page }) => {
    const rows = page.locator('w-slot[row] > *');
    await expect(rows.first()).toHaveAttribute("aria-level", "1");
  });

  test('cells have role="gridcell"', async ({ page }) => {
    const cells = page.locator('w-slot[cell] > *');
    await expect(cells.first()).toHaveAttribute("role", "gridcell");
  });
});
