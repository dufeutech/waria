/**
 * w-avatar - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.1.1 Non-text Content: Alternative text for images
 * - 4.1.2 Name, Role, Value: role="img", aria-label
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const AVATAR = `<w-avatar aria-label="John Doe" fallback="JD"></w-avatar>`;
const AVATAR_WITH_IMAGE = `<w-avatar aria-label="Jane Smith" src="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg'/>"></w-avatar>`;
const AVATAR_DECORATIVE = `<w-avatar decorative fallback="X"></w-avatar>`;
const AVATAR_SIZES = `
<w-avatar aria-label="Small" size="small" fallback="S"></w-avatar>
<w-avatar aria-label="Medium" size="medium" fallback="M"></w-avatar>
<w-avatar aria-label="Large" size="large" fallback="L"></w-avatar>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-avatar", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, AVATAR, "w-avatar");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-avatar" });
  });

  test('has role="img"', async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("role", "img");
  });

  test("has aria-label", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("aria-label", "John Doe");
  });

  test("displays fallback text", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("fallback", "JD");
  });
});

test.describe("w-avatar with image", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, AVATAR_WITH_IMAGE, "w-avatar");
  });

  test("displays image when src is provided", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("src");
  });

  test("still has aria-label for accessibility", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("aria-label", "Jane Smith");
  });
});

test.describe("w-avatar decorative", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, AVATAR_DECORATIVE, "w-avatar");
  });

  test("has aria-hidden when decorative", async ({ page }) => {
    const avatar = page.locator("w-avatar");
    await expect(avatar).toHaveAttribute("aria-hidden", "true");
  });
});

test.describe("w-avatar sizes", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, AVATAR_SIZES, "w-avatar");
  });

  test("supports different sizes", async ({ page }) => {
    const small = page.locator('w-avatar[size="small"]');
    const medium = page.locator('w-avatar[size="medium"]');
    const large = page.locator('w-avatar[size="large"]');

    await expect(small).toHaveAttribute("size", "small");
    await expect(medium).toHaveAttribute("size", "medium");
    await expect(large).toHaveAttribute("size", "large");
  });
});
