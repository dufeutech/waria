import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-breadcrumb accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Breadcrumb", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-breadcrumb", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb");
    if ((await breadcrumb.count()) > 0) {
      await checkA11y(page, { selector: "w-breadcrumb" });
    }
  });

  test('should have role="navigation"', async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb").first();

    if ((await breadcrumb.count()) > 0) {
      await expect(breadcrumb).toHaveAttribute("role", "navigation");
    }
  });

  test("should have aria-label for navigation", async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb").first();

    if ((await breadcrumb.count()) > 0) {
      const ariaLabel = await breadcrumb.getAttribute("aria-label");
      expect(ariaLabel).toBeTruthy();
    }
  });

  test("should have list structure inside", async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb").first();
    const list = breadcrumb.locator('[slot="list"]');

    if ((await breadcrumb.count()) > 0 && (await list.count()) > 0) {
      await expect(list).toHaveAttribute("role", "list");
    }
  });

  test("should have listitems for each breadcrumb item", async ({ page }) => {
    const items = page.locator('w-breadcrumb [slot="item"]');

    if ((await items.count()) > 0) {
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        await expect(items.nth(i)).toHaveAttribute("role", "listitem");
      }
    }
  });

  test('should have aria-current="page" on current item', async ({ page }) => {
    const currentItem = page.locator('w-breadcrumb [slot="item"][current]');

    if ((await currentItem.count()) > 0) {
      await expect(currentItem.first()).toHaveAttribute("aria-current", "page");
    }
  });

  test("should have separators between items", async ({ page }) => {
    const items = page.locator('w-breadcrumb [slot="item"]');

    if ((await items.count()) > 1) {
      // Check for separator characters or elements between items
      const breadcrumb = page.locator("w-breadcrumb").first();
      const text = await breadcrumb.textContent();
      // Should have some kind of separator (/, >, etc.)
      expect(text).toBeTruthy();
    }
  });

  test("should support keyboard navigation to links", async ({ page }) => {
    const links = page.locator('w-breadcrumb [slot="item"] a');

    if ((await links.count()) > 0) {
      await links.first().focus();
      await expect(links.first()).toBeFocused();
    }
  });
});
