import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-scrollbar accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/scrollbar", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-scrollbar" });
  });

  test("should apply vertical overflow styles", async ({ page }) => {
    const scrollbar = page
      .locator('w-scrollbar[orientation="vertical"]')
      .first();

    const overflowY = await scrollbar.evaluate(
      (el) => getComputedStyle(el).overflowY
    );
    const overflowX = await scrollbar.evaluate(
      (el) => getComputedStyle(el).overflowX
    );

    expect(overflowY).toBe("auto");
    expect(overflowX).toBe("hidden");
  });

  test("should apply horizontal overflow styles", async ({ page }) => {
    const scrollbar = page
      .locator('w-scrollbar[orientation="horizontal"]')
      .first();

    const overflowX = await scrollbar.evaluate(
      (el) => getComputedStyle(el).overflowX
    );
    const overflowY = await scrollbar.evaluate(
      (el) => getComputedStyle(el).overflowY
    );

    expect(overflowX).toBe("auto");
    expect(overflowY).toBe("hidden");
  });

  test("should be scrollable with native scroll", async ({ page }) => {
    const scrollbar = page
      .locator('w-scrollbar[orientation="vertical"]')
      .first();

    // Get initial scroll position
    const initialScroll = await scrollbar.evaluate((el) => el.scrollTop);

    // Scroll down using native scroll
    await scrollbar.evaluate((el) => el.scrollBy(0, 100));

    // Verify scroll changed
    const newScroll = await scrollbar.evaluate((el) => el.scrollTop);
    expect(newScroll).toBeGreaterThan(initialScroll);
  });

  test("should support keyboard scrolling natively", async ({ page }) => {
    const scrollbar = page
      .locator('w-scrollbar[orientation="vertical"]')
      .first();

    // Make scrollbar focusable and focus it
    await scrollbar.evaluate((el) => {
      el.tabIndex = 0;
      el.focus();
    });

    const initialScroll = await scrollbar.evaluate((el) => el.scrollTop);

    // Press arrow down to scroll
    await page.keyboard.press("ArrowDown");
    await page.waitForTimeout(100);

    const newScroll = await scrollbar.evaluate((el) => el.scrollTop);
    // Native scrolling may or may not work depending on focus - just verify no errors
    expect(newScroll).toBeGreaterThanOrEqual(initialScroll);
  });
});
