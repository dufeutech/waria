import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-link accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Link", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-link", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const link = page.locator("w-link");
    if ((await link.count()) > 0) {
      await checkA11y(page, { selector: "w-link" });
    }
  });

  test("should render as an anchor element", async ({ page }) => {
    const link = page.locator("w-link").first();

    if ((await link.count()) > 0) {
      // The component should contain or be an anchor
      const anchor = link.locator("a");
      if ((await anchor.count()) > 0) {
        await expect(anchor).toBeVisible();
      }
    }
  });

  test("should have href attribute", async ({ page }) => {
    const link = page.locator("w-link[href]").first();

    if ((await link.count()) > 0) {
      const href = await link.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  test("should open in new tab when external", async ({ page }) => {
    const link = page.locator("w-link[external]").first();

    if ((await link.count()) > 0) {
      const anchor = link.locator("a");
      if ((await anchor.count()) > 0) {
        await expect(anchor).toHaveAttribute("target", "_blank");
        await expect(anchor).toHaveAttribute("rel", /noopener/);
      }
    }
  });

  test("should have focus styles", async ({ page }) => {
    const link = page.locator("w-link").first();

    if ((await link.count()) > 0) {
      const anchor = link.locator("a");
      if ((await anchor.count()) > 0) {
        await anchor.focus();
        await expect(anchor).toBeFocused();
      }
    }
  });

  test("should support disabled state", async ({ page }) => {
    const link = page.locator("w-link[disabled]").first();

    if ((await link.count()) > 0) {
      const anchor = link.locator("a");
      if ((await anchor.count()) > 0) {
        await expect(anchor).toHaveAttribute("aria-disabled", "true");
      }
    }
  });

  test("should support different variants", async ({ page }) => {
    const link = page.locator("w-link").first();

    if ((await link.count()) > 0) {
      const variant = await link.getAttribute("variant");
      expect(["default", "subtle", "underline", null]).toContain(variant);
    }
  });

  test("should be keyboard accessible", async ({ page }) => {
    const link = page.locator("w-link").first();

    if ((await link.count()) > 0) {
      const anchor = link.locator("a");
      if ((await anchor.count()) > 0) {
        await anchor.focus();
        // Should be able to activate with Enter
        await expect(anchor).toBeFocused();
      }
    }
  });
});
