/**
 * w-menu - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper menu/menuitem roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.4.3 Focus Order: Logical navigation in submenus
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const MENU = `
<w-menu>
  <w-slot trigger><button>Open Menu</button></w-slot>
  <w-slot body><div>
    <w-slot item><button name="new">New File</button></w-slot>
    <w-slot item><button name="open">Open...</button></w-slot>
    <w-slot item><button name="save">Save</button></w-slot>
  </div></w-slot>
</w-menu>`;

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
    const trigger = page.locator('w-slot[trigger] > *');

    await expect(trigger).toHaveAttribute("aria-haspopup", "menu");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test('items have role="menuitem"', async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "menuitem");
    }
  });
});
