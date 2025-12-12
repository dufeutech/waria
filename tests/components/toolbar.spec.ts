import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-toolbar accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/toolbar", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-toolbar" });
  });

  test("should have correct ARIA role and attributes", async ({ page }) => {
    const toolbar = page.locator("w-toolbar").first();

    await expect(toolbar).toHaveAttribute("role", "toolbar");
    await expect(toolbar).toHaveAttribute("aria-label");
  });

  test("should have separators with correct role", async ({ page }) => {
    const separator = page.locator('w-toolbar [slot="separator"]').first();

    if ((await separator.count()) > 0) {
      await expect(separator).toHaveAttribute("role", "separator");
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    const items = page.locator('w-toolbar [slot="item"]');

    if ((await items.count()) > 1) {
      await items.first().focus();
      await expect(items.first()).toBeFocused();

      await page.keyboard.press("ArrowRight");
      await expect(items.nth(1)).toBeFocused();
    }
  });

  test("should emit action event on item click", async ({ page }) => {
    const toolbar = page.locator("w-toolbar").first();
    const item = toolbar.locator('[slot="item"]').first();

    const actionEvent = toolbar.evaluate((el) => {
      return new Promise<{ item: string | null }>((resolve) => {
        el.addEventListener(
          "action",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await item.click();
    const detail = await actionEvent;
    expect(detail).toBeDefined();
  });
});
