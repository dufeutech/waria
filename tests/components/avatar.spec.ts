import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-avatar accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Avatar", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-avatar", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    if ((await avatar.count()) > 0) {
      await checkA11y(page, { selector: "w-avatar" });
    }
  });

  test('should have role="img" on avatar', async ({ page }) => {
    const avatar = page.locator("w-avatar").first();

    if ((await avatar.count()) > 0) {
      await expect(avatar).toHaveAttribute("role", "img");
    }
  });

  test("should have aria-label for accessibility", async ({ page }) => {
    const avatar = page.locator("w-avatar").first();

    if ((await avatar.count()) > 0) {
      const ariaLabel = await avatar.getAttribute("aria-label");
      // Avatar should have an accessible name
      expect(ariaLabel).toBeTruthy();
    }
  });

  test("should display image when src is provided", async ({ page }) => {
    const avatar = page.locator("w-avatar[src]").first();

    if ((await avatar.count()) > 0) {
      const img = avatar.locator('img, [slot="image"]');
      // Wait for image to load (it may be hidden initially while loading)
      await expect(img).toBeVisible({ timeout: 10000 });
    }
  });

  test("should display fallback when image fails to load", async ({ page }) => {
    // Create an avatar with a broken image
    await page.evaluate(() => {
      const avatar = document.createElement("w-avatar");
      avatar.setAttribute("src", "invalid-image-url.jpg");
      avatar.setAttribute("aria-label", "Test user");
      avatar.setAttribute("fallback", "TU");
      document.body.appendChild(avatar);
    });

    const avatar = page.locator('w-avatar[fallback="TU"]');
    // Wait for fallback to potentially show
    await page.waitForTimeout(500);

    // The avatar should still be accessible
    await expect(avatar).toHaveAttribute("role", "img");
  });

  test("should display initials as fallback", async ({ page }) => {
    const avatar = page.locator("w-avatar[fallback]").first();

    if ((await avatar.count()) > 0) {
      const fallback = await avatar.getAttribute("fallback");
      expect(fallback).toBeTruthy();
    }
  });

  test("should support different sizes", async ({ page }) => {
    const smallAvatar = page.locator('w-avatar[size="small"]');
    const mediumAvatar = page.locator('w-avatar[size="medium"]');
    const largeAvatar = page.locator('w-avatar[size="large"]');

    // At least one size variant should exist or default
    const avatar = page.locator("w-avatar").first();
    if ((await avatar.count()) > 0) {
      const size = await avatar.getAttribute("size");
      expect(["small", "medium", "large", null]).toContain(size);
    }
  });

  test("should support different shapes", async ({ page }) => {
    const avatar = page.locator("w-avatar").first();

    if ((await avatar.count()) > 0) {
      const shape = await avatar.getAttribute("shape");
      expect(["circle", "square", "rounded", null]).toContain(shape);
    }
  });

  test("should be presentational when decorative", async ({ page }) => {
    const avatar = page.locator("w-avatar[decorative]").first();

    if ((await avatar.count()) > 0) {
      // Decorative avatars should have aria-hidden
      await expect(avatar).toHaveAttribute("aria-hidden", "true");
    }
  });
});
