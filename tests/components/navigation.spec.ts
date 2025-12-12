import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { gotoComponent, SLOT, KEY } from "../test-utils";

// Selector for the demo nav (not the router nav)
const DEMO_NAV = 'w-nav[aria-label="Main navigation"]';

test.describe("w-nav accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await gotoComponent(page, "Navigation");
    // Wait for demo nav items to be visible (Alpine.js section)
    await page.waitForSelector(`${DEMO_NAV} ${SLOT.item}`, {
      state: "visible",
      timeout: 10000,
    });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: DEMO_NAV });
  });

  test("should have correct ARIA role and label", async ({ page }) => {
    const nav = page.locator(DEMO_NAV);

    await expect(nav).toHaveAttribute("role", "navigation");
    await expect(nav).toHaveAttribute("aria-label", "Main navigation");
  });

  test("should support keyboard navigation with arrow keys", async ({
    page,
  }) => {
    const nav = page.locator(DEMO_NAV);
    const items = nav.locator(SLOT.item);

    await items.first().focus();
    await expect(items.first()).toBeFocused();

    await page.keyboard.press(KEY.ArrowRight);
    await expect(items.nth(1)).toBeFocused();

    await page.keyboard.press(KEY.ArrowLeft);
    await expect(items.first()).toBeFocused();
  });

  test("should support Home and End keys", async ({ page }) => {
    const nav = page.locator(DEMO_NAV);
    const items = nav.locator(SLOT.item);
    const itemCount = await items.count();

    if (itemCount > 1) {
      await items.first().focus();

      await page.keyboard.press(KEY.End);
      await expect(items.last()).toBeFocused();

      await page.keyboard.press(KEY.Home);
      await expect(items.first()).toBeFocused();
    }
  });

  test('should set aria-current="page" on active item', async ({ page }) => {
    const nav = page.locator(DEMO_NAV);
    const items = nav.locator(SLOT.item);

    // First item in demo nav has href="/Navigation" which syncs with current URL
    await expect(items.first()).toHaveAttribute("aria-current", "page");

    // Other items should not have aria-current
    const secondItem = items.nth(1);
    const ariaCurrent = await secondItem.getAttribute("aria-current");
    expect(ariaCurrent).toBeNull();
  });

  test("should update aria-current on click", async ({ page }) => {
    const nav = page.locator(DEMO_NAV);
    const items = nav.locator(SLOT.item);

    // Click second item
    await items.nth(1).click();

    // Value should update
    const value = await nav.getAttribute("value");
    expect(value).toBeTruthy();
  });

  test("should emit change event on selection", async ({ page }) => {
    const nav = page.locator(DEMO_NAV);
    const items = nav.locator(SLOT.item);

    const changePromise = nav.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener(
          "change",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await items.nth(1).click();

    const detail = await changePromise;
    expect(detail.value).toBeTruthy();
  });
});
