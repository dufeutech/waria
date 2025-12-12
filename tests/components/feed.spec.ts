import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-feed accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/feed", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-feed" });
  });

  test("should have correct ARIA role", async ({ page }) => {
    const feed = page.locator("w-feed");

    await expect(feed).toHaveAttribute("role", "feed");
    await expect(feed).toHaveAttribute("aria-label");
  });

  test("should have article role on items", async ({ page }) => {
    const items = page.locator('w-feed [slot="item"]');

    if ((await items.count()) > 0) {
      await expect(items.first()).toHaveAttribute("role", "article");
    }
  });

  test("should have aria-setsize and aria-posinset on items", async ({
    page,
  }) => {
    const items = page.locator('w-feed [slot="item"]');
    const count = await items.count();

    if (count > 0) {
      await expect(items.first()).toHaveAttribute(
        "aria-setsize",
        String(count)
      );
      await expect(items.first()).toHaveAttribute("aria-posinset", "1");
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    const items = page.locator('w-feed [slot="item"]');

    if ((await items.count()) > 1) {
      await items.first().focus();
      await expect(items.first()).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowUp");
      await expect(items.first()).toBeFocused();
    }
  });

  test("should support Home and End keys", async ({ page }) => {
    const items = page.locator('w-feed [slot="item"]');
    const count = await items.count();

    if (count > 1) {
      await items.first().focus();

      await page.keyboard.press("End");
      await expect(items.last()).toBeFocused();

      await page.keyboard.press("Home");
      await expect(items.first()).toBeFocused();
    }
  });
});
