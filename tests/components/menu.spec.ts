import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

// Helper to get menu content (works whether portaled or not)
function getMenuContent(page: Page) {
  // When open and portaled, content has role="menu" and data-portal-owner
  // When closed, it's inside w-menu
  // Use a combined selector that works in both cases
  return page
    .locator('[slot="content"][role="menu"]')
    .or(page.locator('w-menu [slot="content"]'));
}

// Helper to get visible menu content
function getVisibleMenuContent(page: Page) {
  return page.locator('[slot="content"][role="menu"]:not([hidden])');
}

// Helper to get menu items from visible content
function getMenuItems(page: Page) {
  return page.locator(
    '[slot="content"][role="menu"]:not([hidden]) > [slot="item"]'
  );
}

// Helper to get a specific item by name
function getMenuItem(page: Page, name: string) {
  return page.locator(
    `[slot="content"][role="menu"]:not([hidden]) > [slot="item"][name="${name}"]`
  );
}

// Helper for submenu content
function getSubmenu(page: Page, parentName: string) {
  return page.locator(`[slot="item"][name="${parentName}"] > [slot="submenu"]`);
}

test.describe("w-menu accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Menu", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-menu", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    await checkA11y(page, { selector: "w-menu" });
  });

  test("should have correct ARIA attributes on trigger", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("should open menu on trigger click", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    const content = getVisibleMenuContent(page);
    await expect(content).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('should have role="menu" on content', async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    const content = getVisibleMenuContent(page);
    await expect(content).toHaveAttribute("role", "menu");
  });

  test('should have role="menuitem" on items', async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    const items = getMenuItems(page);

    const count = await items.count();
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "menuitem");
    }
  });

  test("should have no axe violations when open", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');
    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();

    await checkA11y(page);
  });

  test("should close on Escape key", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    const content = getVisibleMenuContent(page);
    await expect(content).toBeVisible();

    await page.keyboard.press("Escape");
    // After close, content goes back to w-menu and becomes hidden
    await expect(page.locator('w-menu [slot="content"]')).toBeHidden();
  });

  test("should navigate items with arrow keys", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    const items = getMenuItems(page);

    // First item should be focused
    await expect(items.first()).toBeFocused();

    // Arrow down to second item
    await page.keyboard.press("ArrowDown");
    await expect(items.nth(1)).toBeFocused();

    // Arrow up back to first
    await page.keyboard.press("ArrowUp");
    await expect(items.first()).toBeFocused();
  });

  test("should open on Enter key from trigger", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(getVisibleMenuContent(page)).toBeVisible();
  });

  test("should open on ArrowDown from trigger", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.focus();
    await page.keyboard.press("ArrowDown");
    await expect(getVisibleMenuContent(page)).toBeVisible();
  });

  test("should close on item click and emit select", async ({ page }) => {
    const menu = page.locator("w-menu");
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();

    const selectPromise = menu.evaluate((el) => {
      return new Promise<{ item: string }>((resolve) => {
        el.addEventListener(
          "select",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    const firstItem = getMenuItems(page).first();
    await firstItem.click();

    const detail = await selectPromise;
    expect(detail.item).toBeTruthy();
    // After close, content is back in w-menu and hidden
    await expect(page.locator('w-menu [slot="content"]')).toBeHidden();
  });

  test("should return focus to trigger on close", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();
    await expect(getVisibleMenuContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(trigger).toBeFocused();
  });

  test("should open submenu with ArrowRight and focus first item", async ({
    page,
  }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    // Navigate to Export item (New File -> Open -> Export)
    await page.keyboard.press("ArrowDown"); // New File -> Open
    await page.keyboard.press("ArrowDown"); // Open -> Export

    const exportItem = getMenuItem(page, "export");
    await expect(exportItem).toBeFocused();

    // ArrowRight should open submenu
    await page.keyboard.press("ArrowRight");
    const exportSubmenu = getSubmenu(page, "export");
    await expect(exportSubmenu).toBeVisible();

    // First submenu item should be focused
    const pdfItem = exportSubmenu.locator('> [slot="item"][name="export-pdf"]');
    await expect(pdfItem).toBeFocused();
  });

  test("should close submenu with ArrowLeft and return focus to parent", async ({
    page,
  }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    // Navigate to Export and open submenu
    await page.keyboard.press("ArrowDown"); // New File -> Open
    await page.keyboard.press("ArrowDown"); // Open -> Export
    await page.keyboard.press("ArrowRight");

    const exportSubmenu = getSubmenu(page, "export");
    const pdfItem = exportSubmenu.locator('> [slot="item"][name="export-pdf"]');
    await expect(pdfItem).toBeFocused();

    // ArrowLeft should close submenu
    await page.keyboard.press("ArrowLeft");
    await expect(exportSubmenu).toBeHidden();
    await expect(getMenuItem(page, "export")).toBeFocused();
  });

  test("should close submenu with Escape and return focus to parent", async ({
    page,
  }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    // Navigate to Export and open submenu
    await page.keyboard.press("ArrowDown"); // New File -> Open
    await page.keyboard.press("ArrowDown"); // Open -> Export
    await page.keyboard.press("ArrowRight");

    const exportSubmenu = getSubmenu(page, "export");
    const pdfItem = exportSubmenu.locator('> [slot="item"][name="export-pdf"]');
    await expect(pdfItem).toBeFocused();

    // Escape should close submenu first (not the whole menu)
    await page.keyboard.press("Escape");
    await expect(exportSubmenu).toBeHidden();
    await expect(getMenuItem(page, "export")).toBeFocused();
  });

  test("should only have one submenu open at a time", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    const exportItem = getMenuItem(page, "export");
    const editItem = getMenuItem(page, "edit");
    const exportSubmenu = getSubmenu(page, "export");
    const editSubmenu = getSubmenu(page, "edit");

    // Open Export submenu
    await exportItem.click();
    await expect(exportSubmenu).toBeVisible();

    // Now open Edit submenu - Export should close
    await editItem.click();
    await expect(editSubmenu).toBeVisible();
    await expect(exportSubmenu).toBeHidden();
  });

  test("should navigate through deeply nested submenus", async ({ page }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    const exportItem = getMenuItem(page, "export");
    const exportSubmenu = getSubmenu(page, "export");

    // Open Export submenu by clicking
    await exportItem.click();
    await expect(exportSubmenu).toBeVisible();

    // Click Vector to open its submenu
    const vectorItem = exportSubmenu.locator(
      '> [slot="item"][name="export-vector"]'
    );
    const vectorSubmenu = vectorItem.locator('> [slot="submenu"]');

    await vectorItem.click();
    await expect(vectorSubmenu).toBeVisible();
  });

  test("should open nested submenu with ArrowRight from within submenu", async ({
    page,
  }) => {
    const trigger = page.locator('w-menu [slot="trigger"]');

    await trigger.click();

    // Navigate to Export and open
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowRight");

    const exportSubmenu = getSubmenu(page, "export");
    await expect(exportSubmenu).toBeVisible();

    const pdfItem = exportSubmenu.locator('> [slot="item"][name="export-pdf"]');
    const vectorItem = exportSubmenu.locator(
      '> [slot="item"][name="export-vector"]'
    );
    const vectorSubmenu = vectorItem.locator('> [slot="submenu"]');
    const svgItem = vectorSubmenu.locator('> [slot="item"][name="export-svg"]');

    // Wait for focus to settle on first item
    await expect(pdfItem).toBeFocused();

    // Focus Vector directly and open with ArrowRight
    await vectorItem.focus();
    await expect(vectorItem).toBeFocused();

    // Open Vector submenu with ArrowRight
    await page.keyboard.press("ArrowRight");
    await expect(vectorSubmenu).toBeVisible();
    await expect(svgItem).toBeFocused();
  });
});
