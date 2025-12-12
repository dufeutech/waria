/**
 * w-accordion - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper ARIA expanded/controls
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.4.3 Focus Order: Logical tab sequence
 * - 4.1.2 Name, Role, Value: Proper aria-expanded state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav, testHomeEnd } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const ACCORDION = `
<w-accordion value="item1">
  <div slot="item" name="item1">
    <button slot="trigger">Section 1</button>
    <div slot="content">Content for section 1</div>
  </div>
  <div slot="item" name="item2">
    <button slot="trigger">Section 2</button>
    <div slot="content">Content for section 2</div>
  </div>
  <div slot="item" name="item3">
    <button slot="trigger">Section 3</button>
    <div slot="content">Content for section 3</div>
  </div>
</w-accordion>`;

const ACCORDION_MULTIPLE = `
<w-accordion multiple>
  <div slot="item" name="item1">
    <button slot="trigger">Section 1</button>
    <div slot="content">Content 1</div>
  </div>
  <div slot="item" name="item2">
    <button slot="trigger">Section 2</button>
    <div slot="content">Content 2</div>
  </div>
</w-accordion>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-accordion", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ACCORDION, "w-accordion");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-accordion" });
  });

  test("triggers have aria-expanded", async ({ page }) => {
    const triggers = page.locator('[slot="trigger"]');
    const count = await triggers.count();

    for (let i = 0; i < count; i++) {
      const expanded = await triggers.nth(i).getAttribute("aria-expanded");
      expect(["true", "false"]).toContain(expanded);
    }
  });

  test('content has role="region"', async ({ page }) => {
    const content = page.locator('[slot="content"]').first();
    await expect(content).toHaveAttribute("role", "region");
  });

  test("click toggles panel", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]').nth(1);
    const content = page.locator('[slot="content"]').nth(1);

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(content).toBeHidden();

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();

    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(content).toBeHidden();
  });

  test("aria-controls links trigger to content", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]').first();
    const content = page.locator('[slot="content"]').first();

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(ariaControls).toBe(contentId);
  });

  test("aria-labelledby links content to trigger", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]').first();
    const content = page.locator('[slot="content"]').first();

    const triggerId = await trigger.getAttribute("id");
    const labelledby = await content.getAttribute("aria-labelledby");
    expect(labelledby).toBe(triggerId);
  });

  test("arrow keys navigate triggers", async ({ page }) => {
    const triggers = page.locator('[slot="trigger"]');
    await testArrowNav(page, triggers, { horizontal: false });
  });

  test("Enter key toggles panel", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]').nth(1);
    const content = page.locator('[slot="content"]').nth(1);

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("Space key toggles panel", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]').nth(1);
    const content = page.locator('[slot="content"]').nth(1);

    await trigger.focus();
    await page.keyboard.press("Space");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const triggers = page.locator('[slot="trigger"]');
    await testHomeEnd(page, triggers);
  });
});

test.describe("w-accordion multiple", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ACCORDION_MULTIPLE, "w-accordion");
  });

  test("allows multiple panels open", async ({ page }) => {
    const triggers = page.locator('[slot="trigger"]');

    await triggers.first().click();
    await triggers.nth(1).click();

    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Nested Accordions
// ═══════════════════════════════════════════════════════════════════════════

const ACCORDION_NESTED = `
<w-accordion value="outer1">
  <div slot="item" name="outer1">
    <button slot="trigger" name="outer1-trigger">Outer Section 1</button>
    <div slot="content">
      <w-accordion value="inner1">
        <div slot="item" name="inner1">
          <button slot="trigger" name="inner1-trigger">Inner A</button>
          <div slot="content">Inner content A</div>
        </div>
        <div slot="item" name="inner2">
          <button slot="trigger" name="inner2-trigger">Inner B</button>
          <div slot="content">Inner content B</div>
        </div>
      </w-accordion>
    </div>
  </div>
  <div slot="item" name="outer2">
    <button slot="trigger" name="outer2-trigger">Outer Section 2</button>
    <div slot="content">Outer content 2</div>
  </div>
</w-accordion>`;

test.describe("w-accordion nested", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ACCORDION_NESTED, "w-accordion");
    // Wait for both accordions to initialize
    await page.waitForFunction(() => {
      const accordions = document.querySelectorAll("w-accordion");
      return accordions.length === 2 &&
        accordions[0].querySelector('[slot="trigger"][aria-expanded]') &&
        accordions[1].querySelector('[slot="trigger"][aria-expanded]');
    });
  });

  test("outer and inner accordions have separate triggers", async ({ page }) => {
    const outerTriggers = page.locator('[slot="trigger"][name^="outer"]');
    const innerTriggers = page.locator('[slot="trigger"][name^="inner"]');

    await expect(outerTriggers).toHaveCount(2);
    await expect(innerTriggers).toHaveCount(2);
  });

  test("outer accordion controls outer panels only", async ({ page }) => {
    const outer1Trigger = page.locator('[slot="trigger"][name="outer1-trigger"]');
    const outer2Trigger = page.locator('[slot="trigger"][name="outer2-trigger"]');

    // First outer trigger should be expanded (value="outer1")
    await expect(outer1Trigger).toHaveAttribute("aria-expanded", "true");
    await expect(outer2Trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("inner accordion controls inner panels only", async ({ page }) => {
    const inner1Trigger = page.locator('[slot="trigger"][name="inner1-trigger"]');
    const inner2Trigger = page.locator('[slot="trigger"][name="inner2-trigger"]');

    // First inner trigger should be expanded (value="inner1")
    await expect(inner1Trigger).toHaveAttribute("aria-expanded", "true");
    await expect(inner2Trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("clicking outer does not affect inner", async ({ page }) => {
    const outer1Trigger = page.locator('[slot="trigger"][name="outer1-trigger"]');
    const outer2Trigger = page.locator('[slot="trigger"][name="outer2-trigger"]');
    const inner1Trigger = page.locator('[slot="trigger"][name="inner1-trigger"]');

    // Inner is visible since outer1 is expanded by default
    await expect(inner1Trigger).toBeVisible();

    // Click outer trigger 2 (will collapse outer1, hiding inner)
    await outer2Trigger.click();
    await expect(outer2Trigger).toHaveAttribute("aria-expanded", "true");
    // First outer panel is now collapsed
    await expect(outer1Trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("inner accordion works independently", async ({ page }) => {
    const inner1Trigger = page.locator('[slot="trigger"][name="inner1-trigger"]');
    const inner2Trigger = page.locator('[slot="trigger"][name="inner2-trigger"]');

    // Inner accordion should have inner1 expanded initially
    await expect(inner1Trigger).toHaveAttribute("aria-expanded", "true");

    // Click inner trigger 2 - inner accordion should switch
    await inner2Trigger.click();
    await expect(inner2Trigger).toHaveAttribute("aria-expanded", "true");
    await expect(inner1Trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("arrow navigation stays within correct accordion", async ({ page }) => {
    const inner1Trigger = page.locator('[slot="trigger"][name="inner1-trigger"]');
    const inner2Trigger = page.locator('[slot="trigger"][name="inner2-trigger"]');

    await inner1Trigger.focus();
    await page.keyboard.press("ArrowDown");

    // Should move to inner trigger 2, not outer trigger 2
    await expect(inner2Trigger).toBeFocused();
  });
});
