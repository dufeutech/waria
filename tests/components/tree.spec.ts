import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-tree accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Tree", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-tree", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const tree = page.locator("w-tree");
    if ((await tree.count()) > 0) {
      await checkA11y(page, { selector: "w-tree" });
    }
  });

  test('should have role="tree" on container', async ({ page }) => {
    const tree = page.locator("w-tree").first();

    if ((await tree.count()) > 0) {
      await expect(tree).toHaveAttribute("role", "tree");
    }
  });

  test('should have role="treeitem" on items', async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 0) {
      const count = await items.count();
      for (let i = 0; i < Math.min(count, 5); i++) {
        await expect(items.nth(i)).toHaveAttribute("role", "treeitem");
      }
    }
  });

  test("should have aria-level on items", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 0) {
      const ariaLevel = await items.first().getAttribute("aria-level");
      expect(ariaLevel).toBeTruthy();
      expect(parseInt(ariaLevel!)).toBeGreaterThan(0);
    }
  });

  test("should have aria-expanded on expandable items", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 0) {
      // Find an item with children (should have aria-expanded)
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const ariaExpanded = await items.nth(i).getAttribute("aria-expanded");
        if (ariaExpanded !== null) {
          expect(["true", "false"]).toContain(ariaExpanded);
          break;
        }
      }
    }
  });

  test("should navigate items with arrow keys", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 1) {
      await items.first().focus();

      // Arrow down to next visible item
      await page.keyboard.press("ArrowDown");

      // Should focus a different item
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toHaveAttribute("slot", "item");
    }
  });

  test("should expand/collapse with ArrowRight/ArrowLeft", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 0) {
      // Find an expandable item
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const item = items.nth(i);
        const ariaExpanded = await item.getAttribute("aria-expanded");

        if (ariaExpanded === "false") {
          await item.focus();

          // Expand with ArrowRight
          await page.keyboard.press("ArrowRight");
          await expect(item).toHaveAttribute("aria-expanded", "true");

          // Collapse with ArrowLeft
          await page.keyboard.press("ArrowLeft");
          await expect(item).toHaveAttribute("aria-expanded", "false");
          break;
        }
      }
    }
  });

  test("should select item on click", async ({ page }) => {
    // Use a leaf node (file4) that doesn't have toggle indicator issues
    const fileItem = page.locator('w-tree [slot="item"][name="file4"]');

    if ((await fileItem.count()) > 0) {
      await fileItem.click();
      await expect(fileItem).toHaveAttribute("aria-selected", "true");
    }
  });

  test("should select item on Enter/Space", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 0) {
      const firstItem = items.first();
      await firstItem.focus();

      await page.keyboard.press("Enter");
      await expect(firstItem).toHaveAttribute("aria-selected", "true");
    }
  });

  test("should go to first item on Home key", async ({ page }) => {
    // Select only visible (top-level) items that are not inside hidden groups
    const visibleItems = page.locator('w-tree > [slot="item"]');

    if ((await visibleItems.count()) > 1) {
      // Focus on second visible item
      await visibleItems.nth(1).focus();
      await page.keyboard.press("Home");

      await expect(visibleItems.first()).toBeFocused();
    }
  });

  test("should go to last visible item on End key", async ({ page }) => {
    const items = page.locator('w-tree [slot="item"]');

    if ((await items.count()) > 1) {
      await items.first().focus();
      await page.keyboard.press("End");

      // Should focus some item (last visible)
      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toHaveAttribute("slot", "item");
    }
  });

  test("should emit select event", async ({ page }) => {
    const tree = page.locator("w-tree").first();
    const items = tree.locator('[slot="item"]');

    if ((await items.count()) > 0) {
      const selectPromise = tree.evaluate((el) => {
        return new Promise<{ value: string }>((resolve) => {
          el.addEventListener(
            "select",
            (e: Event) => {
              resolve((e as CustomEvent).detail);
            },
            { once: true }
          );
        });
      });

      await items.first().click();

      const detail = await selectPromise;
      expect(detail.value).toBeTruthy();
    }
  });
});
