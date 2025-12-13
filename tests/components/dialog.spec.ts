/**
 * w-dialog - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper dialog role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.1.2 No Keyboard Trap: Escape closes dialog
 * - 2.4.3 Focus Order: Focus trapped within dialog
 * - 4.1.2 Name, Role, Value: Proper ARIA modal attributes
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const DIALOG = `
<w-dialog>
  <w-slot trigger><button>Open Dialog</button></w-slot>
  <w-slot body><div label="Test Dialog">
    <h3>Dialog Title</h3>
    <p>Dialog content goes here.</p>
    <w-slot close><button>Close</button></w-slot>
  </div></w-slot>
</w-dialog>`;

const DIALOG_PERSISTENT = `
<w-dialog persistent>
  <w-slot trigger><button>Open Persistent Dialog</button></w-slot>
  <w-slot body><div label="Persistent Dialog">
    <p>This dialog cannot be closed by clicking outside.</p>
    <w-slot close><button>Close</button></w-slot>
  </div></w-slot>
</w-dialog>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-dialog", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, DIALOG, "w-dialog");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-dialog" });
  });

  test("trigger has correct ARIA attributes", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("click opens dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await expect(dialog).toHaveAttribute("hidden", "");
    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('content has role="dialog" and aria-modal', async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");
    await expect(dialog).toHaveAttribute("role", "dialog");
    await expect(dialog).toHaveAttribute("aria-modal", "true");
  });

  test("axe accessibility scan (open)", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    await trigger.click();
    await expect(page.locator('[role="dialog"]')).not.toHaveAttribute("hidden");
    await checkA11y(page);
  });

  test("Escape key closes dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("hidden", "");
  });

  test("close button closes dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    const closeBtn = dialog.locator('w-slot[close] > *');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    await closeBtn.click();
    await expect(dialog).toHaveAttribute("hidden", "");
  });

  test("focus is trapped within dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    // Focus should be within the dialog - wait for focus to settle
    await page.waitForTimeout(100);
    const focusedElement = await page.evaluate(() => document.activeElement?.closest('[role="dialog"]'));
    expect(focusedElement).toBeTruthy();
  });

  test("focus returns to trigger on close", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    await page.keyboard.press("Escape");
    await expect(dialog).toHaveAttribute("hidden", "");

    await expect(trigger).toBeFocused();
  });

  test("Enter key opens dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(dialog).not.toHaveAttribute("hidden");
  });

  test("Space key opens dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(dialog).not.toHaveAttribute("hidden");
  });
});

test.describe("w-dialog persistent", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, DIALOG_PERSISTENT, "w-dialog");
  });

  test("Escape key does not close persistent dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    await page.keyboard.press("Escape");
    // Persistent dialog stays open on Escape
    await expect(dialog).not.toHaveAttribute("hidden");
  });

  test("close button closes persistent dialog", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');
    const closeBtn = dialog.locator('w-slot[close] > *');

    await trigger.click();
    await expect(dialog).not.toHaveAttribute("hidden");

    await closeBtn.click();
    await expect(dialog).toHaveAttribute("hidden", "");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Nested Dialogs
// ═══════════════════════════════════════════════════════════════════════════

const DIALOG_NESTED = `
<w-dialog>
  <w-slot trigger><button name="outer-trigger">Open Outer Dialog</button></w-slot>
  <w-slot body><div label="Outer Dialog">
    <h3>Outer Dialog</h3>
    <p>This is the outer dialog.</p>
    <w-dialog>
      <w-slot trigger><button name="inner-trigger">Open Inner Dialog</button></w-slot>
      <w-slot body><div label="Inner Dialog" name="inner-content">
        <h4>Inner Dialog</h4>
        <p>This is nested inside the outer.</p>
        <w-slot close><button>Close Inner</button></w-slot>
      </div></w-slot>
    </w-dialog>
    <w-slot close><button>Close Outer</button></w-slot>
  </div></w-slot>
</w-dialog>`;

test.describe("w-dialog nested", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, DIALOG_NESTED, "w-dialog");
  });

  test("outer and inner dialogs have independent triggers", async ({ page }) => {
    const outerTrigger = page.locator('w-slot[trigger][name="outer-trigger"] > *');
    const innerTrigger = page.locator('w-slot[trigger][name="inner-trigger"] > *');

    await expect(outerTrigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(innerTrigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("opening outer dialog does not open inner", async ({ page }) => {
    const outerTrigger = page.locator('w-slot[trigger][name="outer-trigger"] > *');
    const innerTrigger = page.locator('w-slot[trigger][name="inner-trigger"] > *');

    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    // Inner trigger becomes visible but not expanded
    await expect(innerTrigger).toBeVisible();
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("opening inner dialog does not close outer", async ({ page }) => {
    const outerTrigger = page.locator('w-slot[trigger][name="outer-trigger"] > *');
    const innerTrigger = page.locator('w-slot[trigger][name="inner-trigger"] > *');

    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(innerTrigger).toBeVisible();

    await innerTrigger.click();
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "true");
    // Outer should still be open
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
  });

  test("inner dialog has correct ARIA attributes", async ({ page }) => {
    const outerTrigger = page.locator('w-slot[trigger][name="outer-trigger"] > *');
    const innerTrigger = page.locator('w-slot[trigger][name="inner-trigger"] > *');
    const innerDialog = page.locator('w-slot[body][name="inner-content"] > *');

    await outerTrigger.click();
    await expect(innerTrigger).toBeVisible();
    await innerTrigger.click();

    await expect(innerDialog).toHaveAttribute("role", "dialog");
    await expect(innerDialog).toHaveAttribute("aria-modal", "true");
  });
});
