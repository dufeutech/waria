/**
 * w-tooltip - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper tooltip role
 * - 1.4.13 Content on Hover or Focus: Dismissible, hoverable, persistent
 * - 2.1.1 Keyboard: Focus triggers tooltip
 * - 4.1.2 Name, Role, Value: aria-describedby links trigger to tooltip
 */

import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const TOOLTIP = `
<w-tooltip>
  <w-slot trigger><button>Hover me</button></w-slot>
  <w-slot body><div>This is a tooltip!</div></w-slot>
</w-tooltip>`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const getVisibleTooltipContent = (page: Page) =>
  page.locator('w-slot[body][role="tooltip"]:not([hidden]) > *');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-tooltip", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TOOLTIP, "w-tooltip");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-tooltip" });
  });

  test('content has role="tooltip"', async ({ page }) => {
    const content = page.locator('w-slot[body] > *');
    await expect(content).toHaveAttribute("role", "tooltip");
  });

  test("tooltip shows on hover", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await expect(page.locator('w-slot[body] > *')).toHaveAttribute("hidden", "");

    await trigger.hover();
    await page.waitForTimeout(400); // Wait for delay

    await expect(getVisibleTooltipContent(page)).toBeVisible();
  });

  test("tooltip hides on mouse leave", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.hover();
    await page.waitForTimeout(400);
    await expect(getVisibleTooltipContent(page)).toBeVisible();

    await page.mouse.move(0, 0);
    await page.waitForTimeout(200);

    await expect(page.locator('w-slot[body] > *')).toHaveAttribute("hidden", "");
  });

  test("tooltip shows on focus", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(getVisibleTooltipContent(page)).toBeVisible();
  });

  test("tooltip hides on blur", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(getVisibleTooltipContent(page)).toBeVisible();

    await trigger.blur();
    await expect(page.locator('w-slot[body] > *')).toHaveAttribute("hidden", "");
  });

  test("Escape key closes tooltip", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(getVisibleTooltipContent(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('w-slot[body] > *')).toHaveAttribute("hidden", "");
  });

  test("aria-describedby links trigger to tooltip when open", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    const content = getVisibleTooltipContent(page);
    await expect(content).toBeVisible();

    const describedby = await trigger.getAttribute("aria-describedby");
    expect(describedby).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(describedby).toBe(contentId);
  });

  test("axe accessibility scan (open)", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    await trigger.focus();
    await page.waitForTimeout(100);
    await checkA11y(page);
  });
});
