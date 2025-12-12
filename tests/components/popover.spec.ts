import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

// Helper to get visible popover content (works whether portaled or not)
function getVisiblePopoverContent(page: Page) {
  return page.locator('[slot="content"][role="dialog"]:not([hidden])');
}

test.describe("w-popover accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Popover", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-popover", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    const popover = page.locator("w-popover");
    if ((await popover.count()) > 0) {
      await checkA11y(page, { selector: "w-popover" });
    }
  });

  test("should have aria-haspopup on trigger", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    }
  });

  test("should have aria-expanded on trigger", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("should open popover on trigger click", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisiblePopoverContent(page)).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    }
  });

  test('should have role="dialog" on content', async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisiblePopoverContent(page)).toHaveAttribute(
        "role",
        "dialog"
      );
    }
  });

  test("should close on Escape key", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisiblePopoverContent(page)).toBeVisible();

      await page.keyboard.press("Escape");
      // After close, content is back in w-popover and hidden
      await expect(
        page.locator('w-popover [slot="content"]').first()
      ).toBeHidden();
    }
  });

  test("should close on outside click", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisiblePopoverContent(page)).toBeVisible();

      // Click outside
      await page.click("body", { position: { x: 10, y: 10 } });
      // After close, content is back in w-popover and hidden
      await expect(
        page.locator('w-popover [slot="content"]').first()
      ).toBeHidden();
    }
  });

  test("should return focus to trigger on close", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisiblePopoverContent(page)).toBeVisible();

      await page.keyboard.press("Escape");
      await expect(trigger).toBeFocused();
    }
  });

  test("should have aria-controls linking trigger to content", async ({
    page,
  }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      const content = getVisiblePopoverContent(page);
      await expect(content).toBeVisible();

      const ariaControls = await trigger.getAttribute("aria-controls");
      const contentId = await content.getAttribute("id");

      expect(ariaControls).toBe(contentId);
    }
  });

  test("should have no axe violations when open", async ({ page }) => {
    const trigger = page.locator('w-popover [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await checkA11y(page);
    }
  });
});
