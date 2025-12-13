/**
 * w-toast - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 4.1.3 Status Messages: aria-live for announcements
 * - 2.2.1 Timing Adjustable: User can dismiss or extend
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const TOAST = `<w-toast open>Notification message</w-toast>`;
const TOAST_DISMISSIBLE = `
<w-toast open dismissible>
  Dismissible notification
  <w-slot close><button>Close</button></w-slot>
</w-toast>`;
const TOAST_VARIANTS = `
<w-toast open variant="success">Success message</w-toast>
<w-toast open variant="error">Error message</w-toast>
<w-toast open variant="warning">Warning message</w-toast>
<w-toast open variant="info">Info message</w-toast>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-toast", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOAST, "w-toast");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-toast" });
  });

  test('has role="alert" or role="status"', async ({ page }) => {
    const toast = page.locator("w-toast");
    const role = await toast.getAttribute("role");
    expect(["alert", "status"]).toContain(role);
  });

  test("has aria-live attribute", async ({ page }) => {
    const toast = page.locator("w-toast");
    const ariaLive = await toast.getAttribute("aria-live");
    expect(["polite", "assertive"]).toContain(ariaLive);
  });

  test('has aria-atomic="true"', async ({ page }) => {
    const toast = page.locator("w-toast");
    await expect(toast).toHaveAttribute("aria-atomic", "true");
  });

  test("is visible when open", async ({ page }) => {
    const toast = page.locator("w-toast");
    await expect(toast).toBeVisible();
  });
});

test.describe("w-toast dismissible", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOAST_DISMISSIBLE, "w-toast");
  });

  test("has close button", async ({ page }) => {
    const closeBtn = page.locator('w-slot[close] > *');
    await expect(closeBtn).toBeVisible();
  });

  test("closes on close button click", async ({ page }) => {
    const toast = page.locator("w-toast");
    const closeBtn = page.locator('w-slot[close] > *');

    await expect(toast).toHaveAttribute("open", "");
    await closeBtn.click();
    await expect(toast).toBeHidden();
  });

  test("emits close event when dismissed", async ({ page }) => {
    const toast = page.locator("w-toast");
    const closeBtn = page.locator('w-slot[close] > *');

    const closePromise = toast.evaluate((el) => {
      return new Promise<boolean>((resolve) => {
        el.addEventListener("close", () => resolve(true), { once: true });
      });
    });

    await closeBtn.click();

    const closed = await closePromise;
    expect(closed).toBe(true);
  });
});

test.describe("w-toast variants", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOAST_VARIANTS, "w-toast");
  });

  test("supports success variant", async ({ page }) => {
    const toast = page.locator('w-toast[variant="success"]');
    await expect(toast).toHaveAttribute("variant", "success");
  });

  test("supports error variant", async ({ page }) => {
    const toast = page.locator('w-toast[variant="error"]');
    await expect(toast).toHaveAttribute("variant", "error");
  });

  test("supports warning variant", async ({ page }) => {
    const toast = page.locator('w-toast[variant="warning"]');
    await expect(toast).toHaveAttribute("variant", "warning");
  });

  test("supports info variant", async ({ page }) => {
    const toast = page.locator('w-toast[variant="info"]');
    await expect(toast).toHaveAttribute("variant", "info");
  });
});
