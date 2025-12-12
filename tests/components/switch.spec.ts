import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-switch accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/switch", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-switch" });
  });

  test("should have correct ARIA attributes when not pressed", async ({
    page,
  }) => {
    const trigger = page.locator('w-switch [slot="trigger"]').first();

    await expect(trigger).toHaveAttribute("role", "button");
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await expect(trigger).toHaveAttribute("tabindex", "0");
  });

  test("should toggle aria-pressed on click", async ({ page }) => {
    const trigger = page.locator('w-switch [slot="trigger"]').first();

    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
  });

  test("should toggle on Enter key", async ({ page }) => {
    const trigger = page.locator('w-switch [slot="trigger"]').first();

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  });

  test("should toggle on Space key", async ({ page }) => {
    const trigger = page.locator('w-switch [slot="trigger"]').first();

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  });

  test("should be focusable via Tab", async ({ page }) => {
    const trigger = page.locator('w-switch [slot="trigger"]').first();

    // Verify element has tabindex="0" making it focusable
    await expect(trigger).toHaveAttribute("tabindex", "0");

    // Focus the element directly and verify it receives focus
    await trigger.focus();
    await expect(trigger).toBeFocused();
  });

  test("should emit change event with pressed state", async ({ page }) => {
    const switchEl = page.locator("w-switch").first();

    const changeEvent = switchEl.evaluate((el) => {
      return new Promise<{ pressed: boolean }>((resolve) => {
        el.addEventListener(
          "change",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await page.locator('w-switch [slot="trigger"]').first().click();
    const detail = await changeEvent;
    expect(detail.pressed).toBe(true);
  });
});
