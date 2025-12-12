/**
 * w-context-menu - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper menu/menuitem roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const CONTEXT_MENU = `
<w-context-menu>
  <div slot="trigger" style="padding: 2rem; background: #f0f0f0;">
    Right-click here
  </div>
  <div slot="content">
    <button slot="item" name="cut">Cut</button>
    <button slot="item" name="copy">Copy</button>
    <button slot="item" name="paste">Paste</button>
  </div>
</w-context-menu>`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const getVisibleMenuContent = (page: Page) =>
  page.locator('[slot="content"][role="menu"]:not([hidden])');
const getMenuItems = (page: Page) =>
  page.locator('[slot="content"][role="menu"]:not([hidden]) [slot="item"]');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-context-menu", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, CONTEXT_MENU, "w-context-menu");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-context-menu" });
  });

  test("opens on right-click", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleMenuContent(page)).toBeVisible();
  });

  test('content has role="menu"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleMenuContent(page)).toHaveAttribute("role", "menu");
  });

  test('items have role="menuitem"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });
    const items = getMenuItems(page);

    await expect(items.first()).toHaveAttribute("role", "menuitem");
  });

  test("arrow keys navigate items", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });
    const items = getMenuItems(page);

    await expect(items.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();
  });

  test("Escape key closes menu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });
    await expect(getVisibleMenuContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('w-context-menu [slot="content"]')).toHaveAttribute("hidden", "");
  });

  test("item click closes menu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click({ button: "right" });

    await getMenuItems(page).first().click();
    await expect(page.locator('w-context-menu [slot="content"]')).toHaveAttribute("hidden", "");
  });

  test("emits select event", async ({ page }) => {
    const contextMenu = page.locator("w-context-menu");
    const trigger = page.locator('[slot="trigger"]');

    const selectEvent = contextMenu.evaluate((el) => {
      return new Promise<{ item: string | null }>((resolve) => {
        el.addEventListener("select", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await trigger.click({ button: "right" });
    await getMenuItems(page).first().click();

    const detail = await selectEvent;
    expect(detail).toBeDefined();
  });
});
