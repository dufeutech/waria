import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-toggles accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/toggles", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    const toggles = page.locator("w-toggles");
    if ((await toggles.count()) > 0) {
      await checkA11y(page, { selector: "w-toggles" });
    }
  });

  test('should have role="group"', async ({ page }) => {
    const toggles = page.locator("w-toggles").first();

    if ((await toggles.count()) > 0) {
      await expect(toggles).toHaveAttribute("role", "group");
    }
  });

  test("should have aria-label or aria-labelledby", async ({ page }) => {
    const toggles = page.locator("w-toggles").first();

    if ((await toggles.count()) > 0) {
      const ariaLabel = await toggles.getAttribute("aria-label");
      const ariaLabelledby = await toggles.getAttribute("aria-labelledby");
      expect(ariaLabel !== null || ariaLabelledby !== null).toBeTruthy();
    }
  });

  test("should have toggle items with aria-pressed", async ({ page }) => {
    const items = page.locator('w-toggles [slot="item"]');

    if ((await items.count()) > 0) {
      const count = await items.count();
      for (let i = 0; i < count; i++) {
        const pressed = await items.nth(i).getAttribute("aria-pressed");
        expect(["true", "false"]).toContain(pressed);
      }
    }
  });

  test("should toggle item on click", async ({ page }) => {
    const item = page.locator('w-toggles [slot="item"]').first();

    if ((await item.count()) > 0) {
      const initialPressed = await item.getAttribute("aria-pressed");
      await item.click();
      const newPressed = await item.getAttribute("aria-pressed");
      expect(newPressed).not.toBe(initialPressed);
    }
  });

  test("should navigate items with arrow keys", async ({ page }) => {
    const items = page.locator('w-toggles [slot="item"]');

    if ((await items.count()) > 1) {
      await items.first().focus();
      await expect(items.first()).toBeFocused();

      await page.keyboard.press("ArrowRight");
      await expect(items.nth(1)).toBeFocused();

      await page.keyboard.press("ArrowLeft");
      await expect(items.first()).toBeFocused();
    }
  });

  test("should toggle on Enter key", async ({ page }) => {
    const item = page.locator('w-toggles [slot="item"]').first();

    if ((await item.count()) > 0) {
      await item.focus();
      const initialPressed = await item.getAttribute("aria-pressed");
      await page.keyboard.press("Enter");
      const newPressed = await item.getAttribute("aria-pressed");
      expect(newPressed).not.toBe(initialPressed);
    }
  });

  test("should toggle on Space key", async ({ page }) => {
    const item = page.locator('w-toggles [slot="item"]').first();

    if ((await item.count()) > 0) {
      await item.focus();
      const initialPressed = await item.getAttribute("aria-pressed");
      await page.keyboard.press("Space");
      const newPressed = await item.getAttribute("aria-pressed");
      expect(newPressed).not.toBe(initialPressed);
    }
  });

  test("should support single selection mode", async ({ page }) => {
    const toggles = page.locator('w-toggles[mode="single"]');

    if ((await toggles.count()) > 0) {
      const items = toggles.locator('[slot="item"]');
      const count = await items.count();

      if (count >= 2) {
        // Click first item
        await items.first().click();
        await expect(items.first()).toHaveAttribute("aria-pressed", "true");

        // Click second item - first should unpress
        await items.nth(1).click();
        await expect(items.first()).toHaveAttribute("aria-pressed", "false");
        await expect(items.nth(1)).toHaveAttribute("aria-pressed", "true");
      }
    }
  });

  test("should emit change event", async ({ page }) => {
    const toggles = page.locator("w-toggles").first();
    const items = toggles.locator('[slot="item"]');

    if ((await items.count()) > 0) {
      const changePromise = toggles.evaluate((el) => {
        return new Promise<{ value: string[] }>((resolve) => {
          el.addEventListener(
            "change",
            (e: Event) => {
              resolve((e as CustomEvent).detail);
            },
            { once: true }
          );
        });
      });

      await items.first().click();

      const detail = await changePromise;
      expect(detail.value).toBeDefined();
    }
  });
});
