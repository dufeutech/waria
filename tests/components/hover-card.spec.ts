/**
 * w-hover-card - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.4.13 Content on Hover or Focus: Dismissible, hoverable, persistent
 * - 2.1.1 Keyboard: Focus triggers hover card
 * - 4.1.2 Name, Role, Value: Proper ARIA expanded states
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const HOVER_CARD = `
<w-hover-card portal="false" open-delay="0" close-delay="0">
  <w-slot trigger><button>Hover over me</button></w-slot>
  <w-slot body><div>
    <h4>Card Title</h4>
    <p>This is the hover card content.</p>
  </div></w-slot>
</w-hover-card>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-hover-card", () => {
  test.beforeEach(async ({ page }) => {
    // w-hover-card sets aria-expanded on trigger
    await renderComponent(page, HOVER_CARD, 'w-slot[trigger]', "aria-expanded");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-hover-card" });
  });

  test("shows content on focus", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("hides content on blur", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await trigger.blur();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("Escape key closes hover card", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("trigger has aria-expanded", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("shows content on mouse hover", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.hover();

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("hides content on mouse leave", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.hover();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.mouse.move(0, 0);

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("aria-controls links trigger to content", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();
  });
});
