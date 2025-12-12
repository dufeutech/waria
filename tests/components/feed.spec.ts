/**
 * w-feed - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Feed/article roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-setsize, aria-posinset
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testHomeEnd } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const FEED = `
<w-feed label="News feed">
  <article slot="item" name="1">
    <h3>Article 1</h3>
    <p>Content for article 1</p>
  </article>
  <article slot="item" name="2">
    <h3>Article 2</h3>
    <p>Content for article 2</p>
  </article>
  <article slot="item" name="3">
    <h3>Article 3</h3>
    <p>Content for article 3</p>
  </article>
</w-feed>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-feed", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, FEED, "w-feed");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-feed" });
  });

  test('has role="feed"', async ({ page }) => {
    const feed = page.locator("w-feed");
    await expect(feed).toHaveAttribute("role", "feed");
  });

  test("has aria-label", async ({ page }) => {
    const feed = page.locator("w-feed");
    await expect(feed).toHaveAttribute("aria-label", "News feed");
  });

  test('items have role="article"', async ({ page }) => {
    const items = page.locator('[slot="item"]');
    await expect(items.first()).toHaveAttribute("role", "article");
  });

  test("items have aria-setsize and aria-posinset", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    const count = await items.count();

    await expect(items.first()).toHaveAttribute("aria-setsize", String(count));
    await expect(items.first()).toHaveAttribute("aria-posinset", "1");
  });

  test("ArrowDown navigates to next item", async ({ page }) => {
    const items = page.locator('[slot="item"]');

    await items.first().focus();
    await page.keyboard.press("ArrowDown");

    await expect(items.nth(1)).toBeFocused();
  });

  test("ArrowUp navigates to previous item", async ({ page }) => {
    const items = page.locator('[slot="item"]');

    await items.nth(1).focus();
    await page.keyboard.press("ArrowUp");

    await expect(items.first()).toBeFocused();
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    await testHomeEnd(page, items);
  });
});
