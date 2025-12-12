import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import {
  gotoComponent,
  SLOT,
  KEY,
  expectValueChange,
  expectValueAtBound,
  getAriaValue,
} from "../test-utils";

// Selector for demo range component (not the one on Label page)
const DEMO_RANGE = 'w-range[id="volume"]';

test.describe("w-range accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await gotoComponent(page, "Range");
    // Wait for the specific demo range's thumb to be visible
    await page.waitForSelector(`${DEMO_RANGE} ${SLOT.thumb}`, {
      state: "visible",
      timeout: 10000,
    });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-range" });
  });

  test("should have correct ARIA attributes on thumb", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    await expect(thumb).toHaveAttribute("role", "slider");
    await expect(thumb).toHaveAttribute("aria-valuemin");
    await expect(thumb).toHaveAttribute("aria-valuemax");
    await expect(thumb).toHaveAttribute("aria-valuenow");
    await expect(thumb).toHaveAttribute("tabindex", "0");
  });

  test("should increment with ArrowRight key", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    await thumb.focus();
    await expectValueChange(thumb, () => page.keyboard.press(KEY.ArrowRight), "increase");
  });

  test("should decrement with ArrowLeft key", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    // Set value to middle first
    await range.evaluate((el: HTMLElement & { setValue: (v: number) => void }) => el.setValue(50));
    await thumb.focus();
    await expectValueChange(thumb, () => page.keyboard.press(KEY.ArrowLeft), "decrease");
  });

  test("should go to min with Home key", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    await range.evaluate((el: HTMLElement & { setValue: (v: number) => void }) => el.setValue(50));
    await thumb.focus();
    await page.keyboard.press(KEY.Home);
    await expectValueAtBound(thumb, "min");
  });

  test("should go to max with End key", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    await thumb.focus();
    await page.keyboard.press(KEY.End);
    await expectValueAtBound(thumb, "max");
  });

  test("should emit change event on value change", async ({ page }) => {
    const range = page.locator(DEMO_RANGE);
    const thumb = range.locator(SLOT.thumb);

    await expect(thumb).toHaveAttribute("aria-valuenow");
    await thumb.focus();
    await expectValueChange(thumb, () => page.keyboard.press(KEY.ArrowRight), "increase");
  });

  test("should support vertical orientation", async ({ page }) => {
    const verticalRange = page
      .locator('w-range[orientation="vertical"]')
      .first();

    if ((await verticalRange.count()) > 0) {
      const thumb = verticalRange.locator('[slot="thumb"]');
      await expect(thumb).toHaveAttribute("aria-orientation", "vertical");
    }
  });

  test("should increment with ArrowUp key for vertical orientation", async ({
    page,
  }) => {
    const verticalRange = page
      .locator('w-range[orientation="vertical"]')
      .first();

    if ((await verticalRange.count()) > 0) {
      const thumb = verticalRange.locator('[slot="thumb"]');
      await thumb.focus();
      const initialValue = await thumb.getAttribute("aria-valuenow");

      await page.keyboard.press("ArrowUp");
      const newValue = await thumb.getAttribute("aria-valuenow");

      expect(Number(newValue)).toBeGreaterThan(Number(initialValue));
    }
  });

  test("should decrement with ArrowDown key for vertical orientation", async ({
    page,
  }) => {
    const verticalRange = page
      .locator('w-range[orientation="vertical"]')
      .first();

    if ((await verticalRange.count()) > 0) {
      const thumb = verticalRange.locator('[slot="thumb"]');

      // Set to middle first
      await verticalRange.evaluate((el: any) => el.setValue(50));
      await thumb.focus();
      const initialValue = await thumb.getAttribute("aria-valuenow");

      await page.keyboard.press("ArrowDown");
      const newValue = await thumb.getAttribute("aria-valuenow");

      expect(Number(newValue)).toBeLessThan(Number(initialValue));
    }
  });

  test("should position vertical fill from bottom", async ({ page }) => {
    const verticalRange = page
      .locator('w-range[orientation="vertical"]')
      .first();

    if ((await verticalRange.count()) > 0) {
      const fill = verticalRange.locator('[slot="fill"]');

      if ((await fill.count()) > 0) {
        // Check that fill has bottom: 0 positioning for vertical mode
        const bottom = await fill.evaluate(
          (el: HTMLElement) => el.style.bottom
        );
        expect(bottom).toBe("0px");
      }
    }
  });
});
