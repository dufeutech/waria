/**
 * w-menu - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper menu/menuitem roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.4.3 Focus Order: Logical navigation in submenus
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const MENU = `
<w-menu>
  <button slot="trigger">Open Menu</button>
  <div slot="content">
    <button slot="item" name="new">New File</button>
    <button slot="item" name="open">Open...</button>
    <button slot="item" name="save">Save</button>
  </div>
</w-menu>`;

const MENU_WITH_SUBMENU = `
<w-menu>
  <button slot="trigger">Open Menu</button>
  <div slot="content">
    <button slot="item" name="new">New File</button>
    <div slot="item" name="export">
      <span>Export</span>
      <div slot="submenu" hidden>
        <button slot="item" name="export-pdf">PDF</button>
        <button slot="item" name="export-png">PNG</button>
      </div>
    </div>
    <button slot="item" name="settings">Settings</button>
  </div>
</w-menu>`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const getVisibleMenuContent = (page: Page) =>
  page.locator('[slot="content"][role="menu"]:not([hidden])');
const getMenuItems = (page: Page) =>
  page.locator('[slot="content"][role="menu"]:not([hidden]) > [slot="item"]');
const getMenuItem = (page: Page, name: string) =>
  page.locator(`[slot="content"][role="menu"]:not([hidden]) > [slot="item"][name="${name}"]`);

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-menu", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, MENU, "w-menu");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-menu" });
  });

  test("trigger has correct ARIA attributes", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("click opens menu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('content has role="menu"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toHaveAttribute("role", "menu");
  });

  test('items have role="menuitem"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    const items = getMenuItems(page);
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "menuitem");
    }
  });

  test("axe accessibility scan (open)", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();
    await checkA11y(page);
  });

  test("Escape key closes menu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('w-menu [slot="content"]')).toHaveAttribute("hidden", "");
  });

  test("arrow keys navigate items", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    const items = getMenuItems(page);

    await expect(items.first()).toBeFocused();

    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();

    await page.keyboard.press("ArrowUp");
    await expect(items.first()).toBeFocused();
  });

  test("Enter key opens menu from trigger", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(getVisibleMenuContent(page)).toBeVisible();
  });

  test("ArrowDown opens menu from trigger", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(getVisibleMenuContent(page)).toBeVisible();
  });

  test("item click closes menu and emits select", async ({ page }) => {
    const menu = page.locator("w-menu");
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();

    const selectPromise = menu.evaluate((el) => {
      return new Promise<{ item: string }>((resolve) => {
        el.addEventListener("select", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await getMenuItems(page).first().click();

    const detail = await selectPromise;
    expect(detail.item).toBeTruthy();
    await expect(page.locator('w-menu [slot="content"]')).toHaveAttribute("hidden", "");
  });

  test("focus returns to trigger on close", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });
});

test.describe("w-menu with submenu", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, MENU_WITH_SUBMENU, "w-menu");
  });

  test("ArrowRight opens submenu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();

    // Navigate to export item
    await page.keyboard.press("ArrowDown");
    const exportItem = getMenuItem(page, "export");
    await expect(exportItem).toBeFocused();

    // Open submenu
    await page.keyboard.press("ArrowRight");
    const submenu = exportItem.locator('[slot="submenu"]');
    await expect(submenu).not.toHaveAttribute("hidden");
  });

  test("ArrowLeft closes submenu", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    const exportItem = getMenuItem(page, "export");
    const submenu = exportItem.locator('[slot="submenu"]');
    await expect(submenu).not.toHaveAttribute("hidden");

    await page.keyboard.press("ArrowLeft");
    await expect(submenu).toHaveAttribute("hidden", "");
    await expect(exportItem).toBeFocused();
  });

  test("Escape closes submenu first", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    const exportItem = getMenuItem(page, "export");
    const submenu = exportItem.locator('[slot="submenu"]');
    await expect(submenu).not.toHaveAttribute("hidden");

    await page.keyboard.press("Escape");
    await expect(submenu).toHaveAttribute("hidden", "");
    await expect(exportItem).toBeFocused();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Nested Menus (separate w-menu components)
// ═══════════════════════════════════════════════════════════════════════════

const MENU_NESTED = `
<w-menu>
  <button slot="trigger">Outer Menu</button>
  <div slot="content">
    <button slot="item" name="outer1">Outer Item 1</button>
    <w-menu>
      <button slot="trigger" name="nested-trigger">Open Nested</button>
      <div slot="content">
        <button slot="item" name="inner1">Inner Item 1</button>
        <button slot="item" name="inner2">Inner Item 2</button>
      </div>
    </w-menu>
    <button slot="item" name="outer2">Outer Item 2</button>
  </div>
</w-menu>`;

test.describe("w-menu nested", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, MENU_NESTED, "w-menu");
  });

  test("outer and inner menus have independent triggers", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"]').first();
    const innerTrigger = page.locator('[slot="trigger"][name="nested-trigger"]');

    await expect(outerTrigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(innerTrigger).toHaveAttribute("aria-haspopup", "menu");
  });

  test("opening outer menu does not open inner", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"]').first();
    const innerTrigger = page.locator('[slot="trigger"][name="nested-trigger"]');

    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    // Inner trigger becomes visible but not expanded
    await expect(innerTrigger).toBeVisible();
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("opening inner menu does not close outer", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"]').first();
    const innerTrigger = page.locator('[slot="trigger"][name="nested-trigger"]');

    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(innerTrigger).toBeVisible();

    await innerTrigger.click();
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "true");
    // Outer should still be open
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
  });


  test("inner menu items have correct role", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"]').first();
    const innerTrigger = page.locator('[slot="trigger"][name="nested-trigger"]');

    await outerTrigger.click();
    await expect(innerTrigger).toBeVisible();
    await innerTrigger.click();

    const innerItems = page.locator('[slot="item"][name^="inner"]');
    await expect(innerItems.first()).toHaveAttribute("role", "menuitem");
  });
});
