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
  <w-slot trigger><button>Toggle Content</button></w-slot>
  <w-slot body><div>
    <p>Collapsible content goes here.</p>
  </div></w-slot>
</w-collapsible>`;

const COLLAPSIBLE_OPEN = `
<w-collapsible open>
  <w-slot trigger><button>Toggle Content</button></w-slot>
  <w-slot body><div>
    <p>Expanded content is visible.</p>
  </div></w-slot>
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
    const trigger = page.locator('w-slot[trigger] > *');
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("aria-controls links trigger to content", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const content = page.locator('w-slot[body] > *');

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(ariaControls).toBe(contentId);
  });

  test("click toggles content", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await trigger.click();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("Enter key toggles content", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("Space key toggles content", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await page.keyboard.press("Space");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('content has role="region" when expanded', async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    const content = page.locator('w-slot[body] > *');

    await trigger.click();
    await expect(content).toHaveAttribute("role", "region");
  });

  test("emits toggle event", async ({ page }) => {
    const collapsible = page.locator("w-collapsible");
    const trigger = page.locator('w-slot[trigger] > *');

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
    const trigger = page.locator('w-slot[trigger] > *');
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("content is visible when open", async ({ page }) => {
    const content = page.locator('w-slot[body] > *');
    await expect(content).toBeVisible();
  });
});

