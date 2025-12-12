/**
 * w-separator - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper separator role
 * - 4.1.2 Name, Role, Value: aria-orientation
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SEPARATOR_HORIZONTAL = `<w-separator orientation="horizontal"></w-separator>`;
const SEPARATOR_VERTICAL = `<w-separator orientation="vertical"></w-separator>`;
const SEPARATOR_DECORATIVE = `<w-separator decorative></w-separator>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-separator", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SEPARATOR_HORIZONTAL, "w-separator");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-separator" });
  });

  test('has role="separator"', async ({ page }) => {
    const separator = page.locator("w-separator");
    await expect(separator).toHaveAttribute("role", "separator");
  });

  test("has aria-orientation", async ({ page }) => {
    const separator = page.locator("w-separator");
    await expect(separator).toHaveAttribute("aria-orientation", "horizontal");
  });

  test("is not focusable", async ({ page }) => {
    const separator = page.locator("w-separator");
    const tabindex = await separator.getAttribute("tabindex");
    expect(tabindex === null || tabindex === "-1").toBeTruthy();
  });
});

test.describe("w-separator vertical", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SEPARATOR_VERTICAL, "w-separator");
  });

  test("has vertical orientation", async ({ page }) => {
    const separator = page.locator("w-separator");
    await expect(separator).toHaveAttribute("aria-orientation", "vertical");
  });
});

test.describe("w-separator decorative", () => {
  test.beforeEach(async ({ page }) => {
    // Decorative separator has aria-hidden instead of role
    await renderComponent(page, SEPARATOR_DECORATIVE, "w-separator", "aria-hidden");
  });

  test("has aria-hidden and no role when decorative", async ({ page }) => {
    const separator = page.locator("w-separator");
    await expect(separator).toHaveAttribute("aria-hidden", "true");
    // Decorative separators should NOT have role="separator"
    const role = await separator.getAttribute("role");
    expect(role).toBeNull();
  });
});
