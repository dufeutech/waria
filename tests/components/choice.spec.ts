import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-choice accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Choice", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-choice", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-choice" });
  });

  test('should have role="radiogroup" for radio mode', async ({ page }) => {
    const choice = page.locator('w-choice[mode="radio"]').first();
    if ((await choice.count()) > 0) {
      await expect(choice).toHaveAttribute("role", "radiogroup");
    }
  });

  test('should have role="radio" on options in radio mode', async ({
    page,
  }) => {
    const choice = page.locator('w-choice[mode="radio"]').first();
    if ((await choice.count()) > 0) {
      const options = choice.locator('[slot="option"]');

      const count = await options.count();
      for (let i = 0; i < count; i++) {
        await expect(options.nth(i)).toHaveAttribute("role", "radio");
      }
    }
  });

  test("should have aria-checked on options", async ({ page }) => {
    const options = page.locator('w-choice [slot="option"]');

    const count = await options.count();
    for (let i = 0; i < count; i++) {
      const ariaChecked = await options.nth(i).getAttribute("aria-checked");
      expect(["true", "false"]).toContain(ariaChecked);
    }
  });

  test("should update aria-checked on selection", async ({ page }) => {
    const options = page.locator('w-choice [slot="option"]');

    // Click first option
    await options.first().click();
    await expect(options.first()).toHaveAttribute("aria-checked", "true");

    // Click second option (in radio mode, first should become unchecked)
    await options.nth(1).click();
    await expect(options.nth(1)).toHaveAttribute("aria-checked", "true");
  });

  test("should navigate options with arrow keys", async ({ page }) => {
    const options = page.locator('w-choice [slot="option"]');

    await options.first().focus();

    // Arrow down to second option
    await page.keyboard.press("ArrowDown");
    await expect(options.nth(1)).toBeFocused();

    // Arrow up back to first
    await page.keyboard.press("ArrowUp");
    await expect(options.first()).toBeFocused();
  });

  test("should select on Enter key", async ({ page }) => {
    const options = page.locator('w-choice [slot="option"]');

    await options.first().focus();
    await page.keyboard.press("Enter");

    await expect(options.first()).toHaveAttribute("aria-checked", "true");
  });

  test("should select on Space key", async ({ page }) => {
    const options = page.locator('w-choice [slot="option"]');

    await options.first().focus();
    await page.keyboard.press("Space");

    await expect(options.first()).toHaveAttribute("aria-checked", "true");
  });

  test("should have aria-orientation", async ({ page }) => {
    const choice = page.locator("w-choice").first();
    const orientation = await choice.getAttribute("aria-orientation");
    expect(["horizontal", "vertical"]).toContain(orientation);
  });

  test("should emit change event on selection", async ({ page }) => {
    const choice = page.locator("w-choice").first();
    const options = choice.locator('[slot="option"]');

    const changePromise = choice.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener(
          "change",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await options.first().click();

    const detail = await changePromise;
    expect(detail.value).toBeTruthy();
  });
});
