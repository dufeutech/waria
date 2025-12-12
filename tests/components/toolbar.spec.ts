/**
 * w-toolbar - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Toolbar role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-label
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const TOOLBAR = `
<w-toolbar label="Text formatting">
  <button slot="item" name="bold">Bold</button>
  <button slot="item" name="italic">Italic</button>
  <div slot="separator"></div>
  <button slot="item" name="align-left">Left</button>
  <button slot="item" name="align-center">Center</button>
</w-toolbar>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-toolbar", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOOLBAR, "w-toolbar");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-toolbar" });
  });

  test('has role="toolbar"', async ({ page }) => {
    const toolbar = page.locator("w-toolbar");
    await expect(toolbar).toHaveAttribute("role", "toolbar");
  });

  test("has aria-label", async ({ page }) => {
    const toolbar = page.locator("w-toolbar");
    await expect(toolbar).toHaveAttribute("aria-label", "Text formatting");
  });

  test('separator has role="separator"', async ({ page }) => {
    const separator = page.locator('[slot="separator"]');
    await expect(separator).toHaveAttribute("role", "separator");
  });

  test("arrow keys navigate items", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    await testArrowNav(page, items, { horizontal: true });
  });

  test("emits action event on click", async ({ page }) => {
    const toolbar = page.locator("w-toolbar");
    const item = page.locator('[slot="item"]').first();

    const actionPromise = toolbar.evaluate((el) => {
      return new Promise<{ item: string | null }>((resolve) => {
        el.addEventListener("action", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await item.click();

    const detail = await actionPromise;
    expect(detail).toBeDefined();
  });
});
