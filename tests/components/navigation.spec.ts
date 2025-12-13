/**
 * w-nav - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Navigation role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.4.8 Location: aria-current for current page
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav, testHomeEnd } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const NAVIGATION = `
<w-nav label="Main navigation" value="/home">
  <w-slot item><a data-value="/home" href="/home">Home</a></w-slot>
  <w-slot item><a data-value="/about" href="/about">About</a></w-slot>
  <w-slot item><a data-value="/contact" href="/contact">Contact</a></w-slot>
</w-nav>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-nav", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, NAVIGATION, "w-nav");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-nav" });
  });

  test('has role="navigation"', async ({ page }) => {
    const nav = page.locator("w-nav");
    await expect(nav).toHaveAttribute("role", "navigation");
  });

  test("has aria-label", async ({ page }) => {
    const nav = page.locator("w-nav");
    await expect(nav).toHaveAttribute("aria-label", "Main navigation");
  });

  test("arrow keys navigate items", async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    await testArrowNav(page, items, { horizontal: true });
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    await testHomeEnd(page, items);
  });
});
