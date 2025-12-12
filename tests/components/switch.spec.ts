/**
 * w-switch - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper ARIA role/state
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper aria-pressed state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SWITCH = `
<w-switch label="Test Switch">
  <button slot="trigger">Toggle</button>
</w-switch>`;

const SWITCH_PRESSED = `
<w-switch pressed label="Pressed Switch">
  <button slot="trigger">Toggle</button>
</w-switch>`;

const SWITCH_DISABLED = `
<w-switch disabled label="Disabled Switch">
  <button slot="trigger">Toggle</button>
</w-switch>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-switch", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SWITCH, "w-switch");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-switch" });
  });

  test("trigger has correct ARIA attributes", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("role", "button");
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await expect(trigger).toHaveAttribute("tabindex", "0");
  });

  test("click toggles aria-pressed", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
  });

  test("Enter key toggles state", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  });

  test("Space key toggles state", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-pressed", "false");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  });

  test("trigger is focusable", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("tabindex", "0");
    await trigger.focus();
    await expect(trigger).toBeFocused();
  });

  test("emits change event with pressed state", async ({ page }) => {
    const switchEl = page.locator("w-switch");
    const trigger = page.locator('[slot="trigger"]');

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

    await trigger.click();
    const detail = await changeEvent;
    expect(detail.pressed).toBe(true);
  });
});

test.describe("w-switch pressed", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SWITCH_PRESSED, "w-switch");
  });

  test("starts with aria-pressed true", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("w-switch disabled", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SWITCH_DISABLED, "w-switch");
  });

  test("has aria-disabled attribute", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-disabled", "true");
  });
});
