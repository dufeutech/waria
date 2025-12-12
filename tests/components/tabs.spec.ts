import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-tabs accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Tabs", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-tabs", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-tabs" });
  });

  test('should have role="tablist" on tab list container', async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tablist = page.locator("w-tabs").first().locator('[slot="list"]');
    await expect(tablist).toHaveAttribute("role", "tablist");
  });

  test('should have role="tab" on tab triggers', async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    const count = await tabTriggers.count();
    for (let i = 0; i < count; i++) {
      await expect(tabTriggers.nth(i)).toHaveAttribute("role", "tab");
    }
  });

  test('should have role="tabpanel" on panels', async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const panels = tabs.locator('[slot="panel"]');

    const count = await panels.count();
    for (let i = 0; i < count; i++) {
      await expect(panels.nth(i)).toHaveAttribute("role", "tabpanel");
    }
  });

  test("should have aria-selected on active tab", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    // First tab should be selected by default
    await expect(tabTriggers.first()).toHaveAttribute("aria-selected", "true");
  });

  test("should switch tabs on click", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    // Click second tab
    await tabTriggers.nth(1).click();

    await expect(tabTriggers.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabTriggers.first()).toHaveAttribute("aria-selected", "false");
  });

  test("should navigate tabs with arrow keys", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    await tabTriggers.first().focus();

    // Arrow right to second tab
    await page.keyboard.press("ArrowRight");
    await expect(tabTriggers.nth(1)).toBeFocused();

    // Arrow left back to first
    await page.keyboard.press("ArrowLeft");
    await expect(tabTriggers.first()).toBeFocused();
  });

  test("should activate tab on Enter", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    await tabTriggers.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");

    await expect(tabTriggers.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("should activate tab on Space", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    await tabTriggers.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");

    await expect(tabTriggers.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("should go to first tab on Home key", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    await tabTriggers.nth(1).focus();
    await page.keyboard.press("Home");

    await expect(tabTriggers.first()).toBeFocused();
  });

  test("should go to last tab on End key", async ({ page }) => {
    // Target the first tabs component (horizontal) - has 3 tabs
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');

    await tabTriggers.first().focus();
    await page.keyboard.press("End");

    // Last tab in horizontal tabs (tab3)
    await expect(tabTriggers.nth(2)).toBeFocused();
  });

  test("should have aria-controls linking tab to panel", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');
    const panels = tabs.locator('[slot="panel"]');

    const ariaControls = await tabTriggers
      .first()
      .getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const panelId = await panels.first().getAttribute("id");
    expect(ariaControls).toBe(panelId);
  });

  test("should have aria-labelledby on panels", async ({ page }) => {
    // Target the first tabs component (horizontal)
    const tabs = page.locator("w-tabs").first();
    const tabTriggers = tabs.locator('[slot="tab"]');
    const panels = tabs.locator('[slot="panel"]');

    const tabId = await tabTriggers.first().getAttribute("id");
    const ariaLabelledby = await panels.first().getAttribute("aria-labelledby");

    expect(ariaLabelledby).toBe(tabId);
  });

  test("should support vertical orientation", async ({ page }) => {
    const verticalTabs = page.locator('w-tabs[orientation="vertical"]');

    if ((await verticalTabs.count()) > 0) {
      const tablist = verticalTabs.locator('[slot="list"]');
      await expect(tablist).toHaveAttribute("aria-orientation", "vertical");
    }
  });

  test("should navigate vertical tabs with ArrowUp/ArrowDown", async ({
    page,
  }) => {
    const verticalTabs = page.locator('w-tabs[orientation="vertical"]');

    if ((await verticalTabs.count()) > 0) {
      const tabTriggers = verticalTabs.locator('[slot="tab"]');

      await tabTriggers.first().focus();

      // Arrow down to second tab
      await page.keyboard.press("ArrowDown");
      await expect(tabTriggers.nth(1)).toBeFocused();

      // Arrow up back to first
      await page.keyboard.press("ArrowUp");
      await expect(tabTriggers.first()).toBeFocused();
    }
  });
});
