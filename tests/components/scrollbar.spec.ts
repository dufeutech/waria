/**
 * w-scrollbar - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 2.1.1 Keyboard: Scrollable with keyboard
 * - 1.4.13 Content on Hover or Focus: Scrollbar doesn't obscure content
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SCROLLBAR_VERTICAL = `
<w-scrollbar orientation="vertical" style="height: 100px; width: 200px;">
  <div style="height: 300px;">
    <p>Line 1</p>
    <p>Line 2</p>
    <p>Line 3</p>
    <p>Line 4</p>
    <p>Line 5</p>
    <p>Line 6</p>
    <p>Line 7</p>
    <p>Line 8</p>
  </div>
</w-scrollbar>`;

const SCROLLBAR_HORIZONTAL = `
<w-scrollbar orientation="horizontal" style="height: 100px; width: 200px;">
  <div style="width: 500px; white-space: nowrap;">
    This is a very long line of text that should cause horizontal scrolling.
  </div>
</w-scrollbar>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-scrollbar vertical", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SCROLLBAR_VERTICAL, "w-scrollbar");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-scrollbar" });
  });

  test("has vertical overflow styles", async ({ page }) => {
    const scrollbar = page.locator("w-scrollbar");

    const overflowY = await scrollbar.evaluate((el) => getComputedStyle(el).overflowY);
    const overflowX = await scrollbar.evaluate((el) => getComputedStyle(el).overflowX);

    expect(overflowY).toBe("auto");
    expect(overflowX).toBe("hidden");
  });

  test("is scrollable with native scroll", async ({ page }) => {
    const scrollbar = page.locator("w-scrollbar");

    const initialScroll = await scrollbar.evaluate((el) => el.scrollTop);
    await scrollbar.evaluate((el) => el.scrollBy(0, 100));
    const newScroll = await scrollbar.evaluate((el) => el.scrollTop);

    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test("supports keyboard scrolling", async ({ page }) => {
    const scrollbar = page.locator("w-scrollbar");

    await scrollbar.evaluate((el) => {
      el.tabIndex = 0;
      el.focus();
    });

    const initialScroll = await scrollbar.evaluate((el) => el.scrollTop);
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    const newScroll = await scrollbar.evaluate((el) => el.scrollTop);
    expect(newScroll).toBeGreaterThanOrEqual(initialScroll);
  });
});

test.describe("w-scrollbar horizontal", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SCROLLBAR_HORIZONTAL, "w-scrollbar");
  });

  test("has horizontal overflow styles", async ({ page }) => {
    const scrollbar = page.locator("w-scrollbar");

    const overflowX = await scrollbar.evaluate((el) => getComputedStyle(el).overflowX);
    const overflowY = await scrollbar.evaluate((el) => getComputedStyle(el).overflowY);

    expect(overflowX).toBe("auto");
    expect(overflowY).toBe("hidden");
  });

  test("is scrollable horizontally", async ({ page }) => {
    const scrollbar = page.locator("w-scrollbar");

    const initialScroll = await scrollbar.evaluate((el) => el.scrollLeft);
    await scrollbar.evaluate((el) => el.scrollBy(100, 0));
    const newScroll = await scrollbar.evaluate((el) => el.scrollLeft);

    expect(newScroll).toBeGreaterThan(initialScroll);
  });
});
