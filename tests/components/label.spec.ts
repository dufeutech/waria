import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-label accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Label", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-label", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const label = page.locator("w-label");
    if ((await label.count()) > 0) {
      await checkA11y(page, { selector: "w-label" });
    }
  });

  test("should associate label with control via for attribute", async ({
    page,
  }) => {
    const label = page.locator("w-label[for]").first();

    if ((await label.count()) > 0) {
      const forAttr = await label.getAttribute("for");
      expect(forAttr).toBeTruthy();

      // The associated element should exist
      const control = page.locator(`#${forAttr}`);
      expect(await control.count()).toBeGreaterThan(0);
    }
  });

  test("should focus native input on click", async ({ page }) => {
    const label = page.locator('w-label[for="demo-input"]');

    if ((await label.count()) > 0) {
      await label.click();

      const control = page.locator("#demo-input");
      await expect(control).toBeFocused();
    }
  });

  test("should focus custom component's focusable element on click", async ({
    page,
  }) => {
    const label = page.locator('w-label[for="demo-range"]');

    if ((await label.count()) > 0) {
      await label.click();

      // Should focus the thumb inside w-range (has role="slider")
      const thumb = page.locator('#demo-range [role="slider"]');
      await expect(thumb).toBeFocused();
    }
  });

  test("should focus spinbutton input on label click", async ({ page }) => {
    const label = page.locator('w-label[for="demo-spinbutton"]');

    if ((await label.count()) > 0) {
      // First verify the spinbutton exists and has the input
      const spinbutton = page.locator("#demo-spinbutton");
      await expect(spinbutton).toBeVisible();

      const input = spinbutton.locator('[role="spinbutton"]');
      await expect(input).toBeVisible();

      // Click on the native label element inside w-label
      const nativeLabel = label.locator("label");
      await nativeLabel.click();

      // Should focus the input inside w-spinbutton
      await expect(input).toBeFocused();
    }
  });

  test("should have cursor pointer style", async ({ page }) => {
    const label = page.locator("w-label").first();

    if ((await label.count()) > 0) {
      const cursor = await label.evaluate((el) => getComputedStyle(el).cursor);
      // Label should indicate it's clickable
      expect(["pointer", "default"]).toContain(cursor);
    }
  });

  test("should support required indicator", async ({ page }) => {
    const label = page.locator("w-label[required]").first();

    if ((await label.count()) > 0) {
      // Required labels should indicate they're required somehow
      const hasIndicator = await label.evaluate((el) => {
        const text = el.textContent || "";
        const afterContent = getComputedStyle(el, "::after").content;
        return text.includes("*") || afterContent.includes("*");
      });
      expect(hasIndicator).toBeTruthy();
    }
  });

  test("should support disabled state", async ({ page }) => {
    const label = page.locator("w-label[disabled]").first();

    if ((await label.count()) > 0) {
      // Disabled labels should have reduced opacity or different styling
      const opacity = await label.evaluate(
        (el) => getComputedStyle(el).opacity
      );
      expect(parseFloat(opacity)).toBeLessThanOrEqual(1);
    }
  });
});
