/**
 * w-toggles - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper group role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-pressed state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const TOGGLES = `
<w-toggles label="Formatting options">
  <button slot="item" name="bold">Bold</button>
  <button slot="item" name="italic">Italic</button>
  <button slot="item" name="underline">Underline</button>
</w-toggles>`;

const TOGGLES_SINGLE = `
<w-toggles mode="single" label="View mode">
  <button slot="item" name="list">List</button>
  <button slot="item" name="grid">Grid</button>
</w-toggles>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-toggles", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOGGLES, "w-toggles");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-toggles" });
  });

  test('has role="group"', async ({ page }) => {
    const toggles = page.locator("w-toggles");
    await expect(toggles).toHaveAttribute("role", "group");
  });

  test("has aria-label", async ({ page }) => {
    const toggles = page.locator("w-toggles");
    const label = await toggles.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test("items have aria-pressed", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      const pressed = await items.nth(i).getAttribute("aria-pressed");
      expect(["true", "false"]).toContain(pressed);
    }
  });

  test("click toggles aria-pressed", async ({ page }) => {
    const item = page.locator('[slot="item"]').first();

    const initialPressed = await item.getAttribute("aria-pressed");
    await item.click();
    const newPressed = await item.getAttribute("aria-pressed");

    expect(newPressed).not.toBe(initialPressed);
  });

  test("arrow keys navigate items", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    await testArrowNav(page, items, { horizontal: true });
  });

  test("Enter key toggles item", async ({ page }) => {
    const item = page.locator('[slot="item"]').first();

    await item.focus();
    const initialPressed = await item.getAttribute("aria-pressed");
    await page.keyboard.press("Enter");
    const newPressed = await item.getAttribute("aria-pressed");

    expect(newPressed).not.toBe(initialPressed);
  });

  test("Space key toggles item", async ({ page }) => {
    const item = page.locator('[slot="item"]').first();

    await item.focus();
    const initialPressed = await item.getAttribute("aria-pressed");
    await page.keyboard.press("Space");
    const newPressed = await item.getAttribute("aria-pressed");

    expect(newPressed).not.toBe(initialPressed);
  });

  test("emits change event", async ({ page }) => {
    const toggles = page.locator("w-toggles");
    const item = page.locator('[slot="item"]').first();

    const changePromise = toggles.evaluate((el) => {
      return new Promise<{ value: string[] }>((resolve) => {
        el.addEventListener("change", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await item.click();

    const detail = await changePromise;
    expect(detail.value).toBeDefined();
  });
});

test.describe("w-toggles single mode", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOGGLES_SINGLE, "w-toggles");
  });

  test("only one item can be pressed", async ({ page }) => {
    const items = page.locator('[slot="item"]');

    await items.first().click();
    await expect(items.first()).toHaveAttribute("aria-pressed", "true");

    await items.nth(1).click();
    await expect(items.first()).toHaveAttribute("aria-pressed", "false");
    await expect(items.nth(1)).toHaveAttribute("aria-pressed", "true");
  });
});
