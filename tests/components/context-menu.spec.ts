import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

// Helper to get visible context menu content (works whether portaled or not)
function getVisibleContextMenuContent(page: Page) {
  return page.locator('[slot="content"][role="menu"]:not([hidden])');
}

// Helper to get menu items from visible content
function getContextMenuItems(page: Page) {
  return page.locator(
    '[slot="content"][role="menu"]:not([hidden]) [slot="item"]'
  );
}

test.describe("w-context-menu accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/ContextMenu", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-context-menu", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    await checkA11y(page, { selector: "w-context-menu" });
  });

  test("should open on right-click", async ({ page }) => {
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleContextMenuContent(page)).toBeVisible();
  });

  test("should have correct ARIA roles when open", async ({ page }) => {
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    await trigger.click({ button: "right" });
    const content = getVisibleContextMenuContent(page);
    await expect(content).toHaveAttribute("role", "menu");

    const items = getContextMenuItems(page);
    if ((await items.count()) > 0) {
      await expect(items.first()).toHaveAttribute("role", "menuitem");
    }
  });

  test("should support keyboard navigation", async ({ page }) => {
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleContextMenuContent(page)).toBeVisible();

    const items = getContextMenuItems(page);
    if ((await items.count()) > 1) {
      await expect(items.first()).toBeFocused();

      await page.keyboard.press("ArrowDown");
      await expect(items.nth(1)).toBeFocused();
    }
  });

  test("should close on Escape", async ({ page }) => {
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleContextMenuContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    // After close, content is back in w-context-menu and hidden
    await expect(page.locator('w-context-menu [slot="content"]')).toBeHidden();
  });

  test("should close on item selection", async ({ page }) => {
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleContextMenuContent(page)).toBeVisible();

    const items = getContextMenuItems(page);
    await items.first().click();
    // After close, content is back in w-context-menu and hidden
    await expect(page.locator('w-context-menu [slot="content"]')).toBeHidden();
  });

  test("should emit select event", async ({ page }) => {
    const contextMenu = page.locator("w-context-menu");
    const trigger = page.locator('w-context-menu [slot="trigger"]');

    const selectEvent = contextMenu.evaluate((el) => {
      return new Promise<{ item: string | null }>((resolve) => {
        el.addEventListener(
          "select",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await trigger.click({ button: "right" });
    await expect(getVisibleContextMenuContent(page)).toBeVisible();

    const items = getContextMenuItems(page);
    await items.first().click();

    const detail = await selectEvent;
    expect(detail).toBeDefined();
  });
});
