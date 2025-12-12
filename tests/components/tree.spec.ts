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
  <div slot="item" name="folder1">
    Folder 1
    <div role="group">
      <div slot="item" name="file1">File 1</div>
      <div slot="item" name="file2">File 2</div>
    </div>
  </div>
  <div slot="item" name="folder2">
    Folder 2
    <div role="group">
      <div slot="item" name="file3">File 3</div>
    </div>
  </div>
  <div slot="item" name="file4">File 4</div>
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
    const items = page.locator('[slot="item"]');
    const count = await items.count();

    for (let i = 0; i < Math.min(count, 3); i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "treeitem");
    }
  });

  test("items have aria-level", async ({ page }) => {
    const firstItem = page.locator('[slot="item"]').first();
    const level = await firstItem.getAttribute("aria-level");
    expect(level).toBeTruthy();
    expect(parseInt(level!)).toBeGreaterThan(0);
  });

  test("items with children have aria-expanded", async ({ page }) => {
    // Folder1 has children, so it should have aria-expanded
    const folder = page.locator('[slot="item"][name="folder1"]');
    const expanded = await folder.getAttribute("aria-expanded");
    expect(["true", "false"]).toContain(expanded);
  });

  test("ArrowDown navigates to next item", async ({ page }) => {
    const items = page.locator('w-tree > [slot="item"]');

    await items.first().focus();
    await page.keyboard.press("ArrowDown");

    const focused = page.locator(":focus");
    await expect(focused).toHaveAttribute("slot", "item");
  });

  test("ArrowRight expands item with children", async ({ page }) => {
    const folder = page.locator('[slot="item"][name="folder1"]');

    await folder.focus();
    // Item may start collapsed
    await expect(folder).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("ArrowRight");
    await expect(folder).toHaveAttribute("aria-expanded", "true");
  });

  test("ArrowLeft collapses item with children", async ({ page }) => {
    const folder = page.locator('[slot="item"][name="folder1"]');

    await folder.focus();
    await page.keyboard.press("ArrowRight"); // expand first
    await expect(folder).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("ArrowLeft");
    await expect(folder).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter selects item", async ({ page }) => {
    const item = page.locator('[slot="item"]').first();

    await item.focus();
    await page.keyboard.press("Enter");

    await expect(item).toHaveAttribute("aria-selected", "true");
  });

  test("click selects item", async ({ page }) => {
    const item = page.locator('[slot="item"][name="file4"]');

    await item.click();
    await expect(item).toHaveAttribute("aria-selected", "true");
  });

  test("Home goes to first item", async ({ page }) => {
    const items = page.locator('w-tree > [slot="item"]');

    await items.nth(1).focus();
    await page.keyboard.press("Home");

    await expect(items.first()).toBeFocused();
  });

  test("emits select event", async ({ page }) => {
    const tree = page.locator("w-tree");
    const item = page.locator('[slot="item"]').first();

    const selectPromise = tree.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener("select", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await item.click();

    const detail = await selectPromise;
    expect(detail.value).toBeTruthy();
  });
});
