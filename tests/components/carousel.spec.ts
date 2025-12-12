import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-carousel accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Carousel", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-carousel", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-carousel" });
  });

  test("should have correct ARIA role", async ({ page }) => {
    const carousel = page.locator("w-carousel").first();

    await expect(carousel).toHaveAttribute("role", "group");
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
    await expect(carousel).toHaveAttribute("aria-label");
  });

  test("should have slide role on items", async ({ page }) => {
    const carousel = page.locator("w-carousel").first();
    const items = carousel.locator('[slot="item"]');

    if ((await items.count()) > 0) {
      const visibleItem = items.first();
      await expect(visibleItem).toHaveAttribute("role", "group");
      await expect(visibleItem).toHaveAttribute(
        "aria-roledescription",
        "slide"
      );
    }
  });

  test("should navigate with arrow keys", async ({ page }) => {
    const carousel = page.locator("w-carousel").first();
    const items = carousel.locator('[slot="item"]');

    if ((await items.count()) > 1) {
      // Focus the active item (first item has tabindex="0")
      const activeItem = items.first();
      await activeItem.focus();
      await page.keyboard.press("ArrowRight");

      // Second item should now be visible
      await expect(items.nth(1)).not.toBeHidden();
    }
  });

  test("should navigate with prev/next buttons", async ({ page }) => {
    const carousel = page.locator("w-carousel").first();
    const next = carousel.locator('[slot="next"]');
    const prev = carousel.locator('[slot="prev"]');
    const items = carousel.locator('[slot="item"]');

    if ((await items.count()) > 1 && (await next.count()) > 0) {
      await next.click();
      await expect(items.nth(1)).not.toBeHidden();

      await prev.click();
      await expect(items.first()).not.toBeHidden();
    }
  });

  test("should emit change event", async ({ page }) => {
    const carousel = page.locator("w-carousel").first();
    const next = carousel.locator('[slot="next"]');

    if ((await next.count()) > 0) {
      const changeEvent = carousel.evaluate((el) => {
        return new Promise<{ current: number; previous: number }>((resolve) => {
          el.addEventListener(
            "change",
            (e: Event) => {
              resolve((e as CustomEvent).detail);
            },
            { once: true }
          );
        });
      });

      await next.click();
      const detail = await changeEvent;

      expect(detail.previous).toBe(0);
      expect(detail.current).toBe(1);
    }
  });
});
