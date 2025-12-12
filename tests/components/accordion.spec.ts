import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-accordion accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Accordion", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector('w-accordion [slot="trigger"]', {
      state: "visible",
    });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-accordion" });
  });

  test("should have aria-expanded on triggers", async ({ page }) => {
    const triggers = page.locator('w-accordion [slot="trigger"]');

    const count = await triggers.count();
    for (let i = 0; i < count; i++) {
      const ariaExpanded = await triggers.nth(i).getAttribute("aria-expanded");
      expect(["true", "false"]).toContain(ariaExpanded);
    }
  });

  test('should have role="region" on content panels', async ({ page }) => {
    // First expand an item to see the content
    const trigger = page.locator('w-accordion [slot="trigger"]').first();
    await trigger.click();

    const content = page.locator('w-accordion [slot="content"]').first();
    await expect(content).toHaveAttribute("role", "region");
  });

  test("should toggle panel on trigger click", async ({ page }) => {
    // Use second trigger which starts collapsed (first has value="item1" so it's expanded)
    const trigger = page.locator('w-accordion [slot="trigger"]').nth(1);
    const content = page.locator('w-accordion [slot="content"]').nth(1);

    // Initially collapsed
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(content).toBeHidden();

    // Click to expand
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();

    // Click to collapse
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(content).toBeHidden();
  });

  test("should have aria-controls linking trigger to content", async ({
    page,
  }) => {
    const trigger = page.locator('w-accordion [slot="trigger"]').first();
    const content = page.locator('w-accordion [slot="content"]').first();

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(ariaControls).toBe(contentId);
  });

  test("should have aria-labelledby on content", async ({ page }) => {
    const trigger = page.locator('w-accordion [slot="trigger"]').first();
    const content = page.locator('w-accordion [slot="content"]').first();

    const triggerId = await trigger.getAttribute("id");
    const ariaLabelledby = await content.getAttribute("aria-labelledby");

    expect(ariaLabelledby).toBe(triggerId);
  });

  test("should navigate triggers with arrow keys", async ({ page }) => {
    const triggers = page.locator('w-accordion [slot="trigger"]');

    await triggers.first().focus();

    // Arrow down to second trigger
    await page.keyboard.press("ArrowDown");
    await expect(triggers.nth(1)).toBeFocused();

    // Arrow up back to first
    await page.keyboard.press("ArrowUp");
    await expect(triggers.first()).toBeFocused();
  });

  test("should toggle on Enter key", async ({ page }) => {
    // Use second trigger which starts collapsed
    const trigger = page.locator('w-accordion [slot="trigger"]').nth(1);
    const content = page.locator('w-accordion [slot="content"]').nth(1);

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("should toggle on Space key", async ({ page }) => {
    // Use second trigger which starts collapsed
    const trigger = page.locator('w-accordion [slot="trigger"]').nth(1);
    const content = page.locator('w-accordion [slot="content"]').nth(1);

    await trigger.focus();
    await page.keyboard.press("Space");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("should go to first trigger on Home key", async ({ page }) => {
    const triggers = page.locator('w-accordion [slot="trigger"]');

    await triggers.nth(1).focus();
    await page.keyboard.press("Home");

    await expect(triggers.first()).toBeFocused();
  });

  test("should go to last trigger on End key", async ({ page }) => {
    const triggers = page.locator('w-accordion [slot="trigger"]');

    await triggers.first().focus();
    await page.keyboard.press("End");

    await expect(triggers.last()).toBeFocused();
  });
});
