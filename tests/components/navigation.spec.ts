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
  <a slot="item" data-value="/home" href="/home">Home</a>
  <a slot="item" data-value="/about" href="/about">About</a>
  <a slot="item" data-value="/contact" href="/contact">Contact</a>
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
    const items = page.locator('[slot="item"]');
    await testArrowNav(page, items, { horizontal: true });
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const items = page.locator('[slot="item"]');
    await testHomeEnd(page, items);
  });

  test('clicked item has aria-current="page"', async ({ page }) => {
    // Click an item and verify it gets aria-current
    const aboutItem = page.locator('[slot="item"][data-value="/about"]');
    await aboutItem.click();
    await expect(aboutItem).toHaveAttribute("aria-current", "page");

    // Verify only one item has aria-current at a time
    const homeItem = page.locator('[slot="item"][data-value="/home"]');
    await expect(homeItem).not.toHaveAttribute("aria-current");
  });

  test('programmatic value sets aria-current="page"', async ({ page }) => {
    // Setting value attribute should update aria-current
    const nav = page.locator("w-nav");
    const homeItem = page.locator('[slot="item"][data-value="/home"]');

    await nav.evaluate((el) => {
      el.setAttribute("value", "/home");
    });

    await expect(homeItem).toHaveAttribute("aria-current", "page");
  });

  test("click updates selection", async ({ page }) => {
    const nav = page.locator("w-nav");
    const aboutItem = page.locator('[slot="item"][data-value="/about"]');

    await aboutItem.click();

    const value = await nav.getAttribute("value");
    expect(value).toBe("/about");
  });

  test("emits change event", async ({ page }) => {
    const nav = page.locator("w-nav");
    const aboutItem = page.locator('[slot="item"][data-value="/about"]');

    const changePromise = nav.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener("change", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await aboutItem.click();

    const detail = await changePromise;
    expect(detail.value).toBe("/about");
  });
});
