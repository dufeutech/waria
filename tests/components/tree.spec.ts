/**
 * w-tree - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Tree/treeitem roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-expanded, aria-level, aria-selected
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

// Tree items with children automatically get aria-expanded
// The component detects children by nested [slot="item"] elements
const TREE = `
<w-tree>
  <w-slot item name="folder1"><div>
    Folder 1
    <div role="group">
      <w-slot item name="file1"><div>File 1</div></w-slot>
      <w-slot item name="file2"><div>File 2</div></w-slot>
    </div>
  </div></w-slot>
  <w-slot item name="folder2"><div>
    Folder 2
    <div role="group">
      <w-slot item name="file3"><div>File 3</div></w-slot>
    </div>
  </div></w-slot>
  <w-slot item name="file4"><div>File 4</div></w-slot>
</w-tree>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-tree", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TREE, "w-tree");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-tree" });
  });

  test('has role="tree"', async ({ page }) => {
    const tree = page.locator("w-tree");
    await expect(tree).toHaveAttribute("role", "tree");
  });

  test('items have role="treeitem"', async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    const count = await items.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "treeitem");
    }
  });

  test("items have aria-level", async ({ page }) => {
    const firstItem = page.locator('w-slot[item] > *').first();
    const level = await firstItem.getAttribute("aria-level");
    expect(level).toBeTruthy();
    expect(parseInt(level!)).toBeGreaterThan(0);
  });
});
