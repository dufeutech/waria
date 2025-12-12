/**
 * w-collapsible - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper ARIA expanded/controls
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper aria-expanded state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const COLLAPSIBLE = `
<w-collapsible>
  <button slot="trigger">Toggle Content</button>
  <div slot="content">
    <p>Collapsible content goes here.</p>
  </div>
</w-collapsible>`;

const COLLAPSIBLE_OPEN = `
<w-collapsible open>
  <button slot="trigger">Toggle Content</button>
  <div slot="content">
    <p>Expanded content is visible.</p>
  </div>
</w-collapsible>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-collapsible", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, COLLAPSIBLE, "w-collapsible");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-collapsible" });
  });

  test("trigger has aria-expanded attribute", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("aria-controls links trigger to content", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    const content = page.locator('[slot="content"]');

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(ariaControls).toBe(contentId);
  });

  test("click toggles content", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter key toggles content", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("Space key toggles content", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('content has role="region" when expanded', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    const content = page.locator('[slot="content"]');

    await trigger.click();
    await expect(content).toHaveAttribute("role", "region");
  });

  test("emits toggle event", async ({ page }) => {
    const collapsible = page.locator("w-collapsible");
    const trigger = page.locator('[slot="trigger"]');

    const togglePromise = collapsible.evaluate((el) => {
      return new Promise<{ open: boolean }>((resolve) => {
        el.addEventListener(
          "toggle",
          (e: Event) => {
            resolve((e as CustomEvent).detail);
          },
          { once: true }
        );
      });
    });

    await trigger.click();
    const detail = await togglePromise;
    expect(detail.open).toBe(true);
  });
});

test.describe("w-collapsible open", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, COLLAPSIBLE_OPEN, "w-collapsible");
  });

  test("starts with aria-expanded true", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("content is visible when open", async ({ page }) => {
    const content = page.locator('[slot="content"]');
    await expect(content).toBeVisible();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Nested Collapsibles
// ═══════════════════════════════════════════════════════════════════════════

const COLLAPSIBLE_NESTED = `
<w-collapsible>
  <button slot="trigger" name="outer-trigger">Outer Toggle</button>
  <div slot="content" name="outer-content">
    <p>Outer content</p>
    <w-collapsible>
      <button slot="trigger" name="inner-trigger">Inner Toggle</button>
      <div slot="content" name="inner-content">
        <p>Inner content - deeply nested</p>
      </div>
    </w-collapsible>
  </div>
</w-collapsible>`;

test.describe("w-collapsible nested", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, COLLAPSIBLE_NESTED, "w-collapsible");
  });

  test("outer and inner have independent triggers", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"][name="outer-trigger"]');
    const innerTrigger = page.locator('[slot="trigger"][name="inner-trigger"]');

    await expect(outerTrigger).toHaveAttribute("aria-expanded", "false");
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("expanding outer does not expand inner", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"][name="outer-trigger"]');
    const innerTrigger = page.locator('[slot="trigger"][name="inner-trigger"]');

    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "false");
  });

  test("inner collapsible works independently", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"][name="outer-trigger"]');
    const innerTrigger = page.locator('[slot="trigger"][name="inner-trigger"]');

    // First expand outer to access inner
    await outerTrigger.click();
    await expect(outerTrigger).toHaveAttribute("aria-expanded", "true");

    // Then expand inner
    await innerTrigger.click();
    await expect(innerTrigger).toHaveAttribute("aria-expanded", "true");
  });

  test("inner aria-controls is independent from outer", async ({ page }) => {
    const outerTrigger = page.locator('[slot="trigger"][name="outer-trigger"]');
    const outerContent = page.locator('[slot="content"][name="outer-content"]');
    const innerTrigger = page.locator('[slot="trigger"][name="inner-trigger"]');
    const innerContent = page.locator('[slot="content"][name="inner-content"]');

    // Expand outer to initialize inner
    await outerTrigger.click();

    const outerAriaControls = await outerTrigger.getAttribute("aria-controls");
    const innerAriaControls = await innerTrigger.getAttribute("aria-controls");
    const outerContentId = await outerContent.getAttribute("id");
    const innerContentId = await innerContent.getAttribute("id");

    expect(outerAriaControls).toBe(outerContentId);
    expect(innerAriaControls).toBe(innerContentId);
    expect(outerAriaControls).not.toBe(innerAriaControls);
  });
});
