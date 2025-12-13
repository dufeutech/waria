/**
 * w-breadcrumb - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Navigation role, list structure
 * - 2.4.4 Link Purpose: Clear breadcrumb trail
 * - 2.4.8 Location: Shows current location
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const BREADCRUMB = `
<w-breadcrumb label="Breadcrumb">
  <w-slot list><ol>
    <w-slot item><li><a href="/">Home</a></li></w-slot>
    <w-slot item><li><a href="/products">Products</a></li></w-slot>
    <w-slot item><li current><span>Current Page</span></li></w-slot>
  </ol></w-slot>
</w-breadcrumb>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-breadcrumb", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, BREADCRUMB, "w-breadcrumb");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-breadcrumb" });
  });

  test('has role="navigation"', async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb");
    await expect(breadcrumb).toHaveAttribute("role", "navigation");
  });

  test("has aria-label", async ({ page }) => {
    const breadcrumb = page.locator("w-breadcrumb");
    const label = await breadcrumb.getAttribute("aria-label");
    expect(label).toBeTruthy();
  });

  test('list has role="list"', async ({ page }) => {
    const list = page.locator('w-slot[list] > *');
    await expect(list).toHaveAttribute("role", "list");
  });

  test('items have role="listitem"', async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    const count = await items.count();

    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toHaveAttribute("role", "listitem");
    }
  });

  test('current item has aria-current="page"', async ({ page }) => {
    const current = page.locator('w-slot[item][current] > *');
    await expect(current).toHaveAttribute("aria-current", "page");
  });

  test("links are keyboard accessible", async ({ page }) => {
    const links = page.locator('w-slot[item] > * a');

    await links.first().focus();
    await expect(links.first()).toBeFocused();
  });
});
