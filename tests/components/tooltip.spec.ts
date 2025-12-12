import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

// Helper to get tooltip content (works whether portaled or not)
function getTooltipContent(page: Page) {
  // When open and portaled, content has role="tooltip"
  // Use a selector that works in both cases
  return page.locator('[slot="content"][role="tooltip"]');
}

// Helper to get visible tooltip content
function getVisibleTooltipContent(page: Page) {
  return page.locator('[slot="content"][role="tooltip"]:not([hidden])');
}

test.describe("w-tooltip accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Tooltip", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-tooltip", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    await checkA11y(page, { selector: "w-tooltip" });
  });

  test('should have role="tooltip" on content', async ({ page }) => {
    const content = page.locator('w-tooltip [slot="content"]');

    if ((await content.count()) > 0) {
      await expect(content.first()).toHaveAttribute("role", "tooltip");
    }
  });

  test("should show tooltip on hover", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      // Initially hidden (check before opening)
      await expect(
        page.locator('w-tooltip [slot="content"]').first()
      ).toBeHidden();

      await trigger.hover();

      // Wait for delay (default 300ms)
      await page.waitForTimeout(400);

      await expect(getVisibleTooltipContent(page)).toBeVisible();
    }
  });

  test("should hide tooltip on mouse leave", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.hover();
      await page.waitForTimeout(400);
      await expect(getVisibleTooltipContent(page)).toBeVisible();

      // Move mouse away
      await page.mouse.move(0, 0);
      await page.waitForTimeout(200);

      // After close, content is back in w-tooltip and hidden
      await expect(
        page.locator('w-tooltip [slot="content"]').first()
      ).toBeHidden();
    }
  });

  test("should show tooltip on focus", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      await expect(getVisibleTooltipContent(page)).toBeVisible();
    }
  });

  test("should hide tooltip on blur", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      await expect(getVisibleTooltipContent(page)).toBeVisible();

      await trigger.blur();
      // After close, content is back in w-tooltip and hidden
      await expect(
        page.locator('w-tooltip [slot="content"]').first()
      ).toBeHidden();
    }
  });

  test("should close on Escape key", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      await expect(getVisibleTooltipContent(page)).toBeVisible();

      await page.keyboard.press("Escape");
      // After close, content is back in w-tooltip and hidden
      await expect(
        page.locator('w-tooltip [slot="content"]').first()
      ).toBeHidden();
    }
  });

  test("should have aria-describedby when open", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      const content = getVisibleTooltipContent(page);
      await expect(content).toBeVisible();

      const ariaDescribedby = await trigger.getAttribute("aria-describedby");
      expect(ariaDescribedby).toBeTruthy();

      const contentId = await content.getAttribute("id");
      expect(ariaDescribedby).toBe(contentId);
    }
  });

  test("should have no axe violations when open", async ({ page }) => {
    const trigger = page.locator('w-tooltip [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      await page.waitForTimeout(100);

      await checkA11y(page);
    }
  });
});
