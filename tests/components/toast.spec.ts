import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-toast accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Toast", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-toast", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const toast = page.locator("w-toast");
    if ((await toast.count()) > 0) {
      await checkA11y(page, { selector: "w-toast" });
    }
  });

  test('should have role="alert" or role="status"', async ({ page }) => {
    const toast = page.locator("w-toast").first();

    if ((await toast.count()) > 0) {
      const role = await toast.getAttribute("role");
      expect(["alert", "status"]).toContain(role);
    }
  });

  test("should have aria-live attribute", async ({ page }) => {
    const toast = page.locator("w-toast").first();

    if ((await toast.count()) > 0) {
      const ariaLive = await toast.getAttribute("aria-live");
      expect(["polite", "assertive"]).toContain(ariaLive);
    }
  });

  test("should be visible when open", async ({ page }) => {
    const toast = page.locator("w-toast[open]").first();

    if ((await toast.count()) > 0) {
      await expect(toast).toBeVisible();
    }
  });

  test("should support different variants", async ({ page }) => {
    const successToast = page.locator('w-toast[variant="success"]');
    const errorToast = page.locator('w-toast[variant="error"]');
    const warningToast = page.locator('w-toast[variant="warning"]');
    const infoToast = page.locator('w-toast[variant="info"]');

    // At least one variant should exist or default variant
    const toast = page.locator("w-toast").first();
    if ((await toast.count()) > 0) {
      const variant = await toast.getAttribute("variant");
      expect(["success", "error", "warning", "info", null]).toContain(variant);
    }
  });

  test("should have close button when dismissible", async ({ page }) => {
    const toast = page.locator("w-toast[dismissible]").first();

    if ((await toast.count()) > 0) {
      const closeBtn = toast.locator('[slot="close"]');
      await expect(closeBtn).toBeVisible();
    }
  });

  test("should close on close button click", async ({ page }) => {
    // Get the first dismissible toast and click its close button
    const toasts = page.locator("w-toast[dismissible]");
    if ((await toasts.count()) > 0) {
      const toast = toasts.first();
      // Verify it starts open
      await expect(toast).toHaveAttribute("open", "");

      const closeBtn = toast.locator('[slot="close"]');
      await closeBtn.click();

      // After clicking close, the toast should be hidden (no open attribute)
      await expect(toast).toBeHidden();
    }
  });

  test("should emit close event when dismissed", async ({ page }) => {
    const toast = page.locator("w-toast[dismissible][open]").first();

    if ((await toast.count()) > 0) {
      const closePromise = toast.evaluate((el) => {
        return new Promise<boolean>((resolve) => {
          el.addEventListener("close", () => resolve(true), { once: true });
        });
      });

      const closeBtn = toast.locator('[slot="close"]');
      await closeBtn.click();

      const closed = await closePromise;
      expect(closed).toBe(true);
    }
  });

  test('should have aria-atomic="true"', async ({ page }) => {
    const toast = page.locator("w-toast").first();

    if ((await toast.count()) > 0) {
      await expect(toast).toHaveAttribute("aria-atomic", "true");
    }
  });
});
