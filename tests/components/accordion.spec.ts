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
  <w-slot item><div name="item1">
    <w-slot trigger><button>Section 1</button></w-slot>
    <w-slot body><div>Content for section 1</div></w-slot>
  </div></w-slot>
  <w-slot item><div name="item2">
    <w-slot trigger><button>Section 2</button></w-slot>
    <w-slot body><div>Content for section 2</div></w-slot>
  </div></w-slot>
  <w-slot item><div name="item3">
    <w-slot trigger><button>Section 3</button></w-slot>
    <w-slot body><div>Content for section 3</div></w-slot>
  </div></w-slot>
</w-accordion>`;

const ACCORDION_MULTIPLE = `
<w-accordion multiple>
  <w-slot item><div name="item1">
    <w-slot trigger><button>Section 1</button></w-slot>
    <w-slot body><div>Content 1</div></w-slot>
  </div></w-slot>
  <w-slot item><div name="item2">
    <w-slot trigger><button>Section 2</button></w-slot>
    <w-slot body><div>Content 2</div></w-slot>
  </div></w-slot>
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
    const triggers = page.locator('w-slot[trigger] > *');
    const count = await triggers.count();

    for (let i = 0; i < count; i++) {
      const expanded = await triggers.nth(i).getAttribute("aria-expanded");
      expect(["true", "false"]).toContain(expanded);
    }
  });

  test('content has role="region"', async ({ page }) => {
    const content = page.locator('w-slot[body] > *').first();
    await expect(content).toHaveAttribute("role", "region");
  });

  test("click toggles panel", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *').nth(1);
    const content = page.locator('w-slot[body] > *').nth(1);

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
    const trigger = page.locator('w-slot[trigger] > *').first();
    const content = page.locator('w-slot[body] > *').first();

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();

    const contentId = await content.getAttribute("id");
    expect(ariaControls).toBe(contentId);
  });

  test("aria-labelledby links content to trigger", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *').first();
    const content = page.locator('w-slot[body] > *').first();

    const triggerId = await trigger.getAttribute("id");
    const labelledby = await content.getAttribute("aria-labelledby");
    expect(labelledby).toBe(triggerId);
  });

  test("arrow keys navigate triggers", async ({ page }) => {
    const triggers = page.locator('w-slot[trigger] > *');
    await testArrowNav(page, triggers, { horizontal: false });
  });

  test("Enter key toggles panel", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *').nth(1);
    const content = page.locator('w-slot[body] > *').nth(1);

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");

    await page.keyboard.press("Enter");
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("Space key toggles panel", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *').nth(1);
    const content = page.locator('w-slot[body] > *').nth(1);

    await trigger.focus();
    await page.keyboard.press("Space");

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(content).toBeVisible();
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const triggers = page.locator('w-slot[trigger] > *');
    await testHomeEnd(page, triggers);
  });
});

test.describe("w-accordion multiple", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ACCORDION_MULTIPLE, "w-accordion");
  });

  test("allows multiple panels open", async ({ page }) => {
    const triggers = page.locator('w-slot[trigger] > *');

    await triggers.first().click();
    await triggers.nth(1).click();

    await expect(triggers.first()).toHaveAttribute("aria-expanded", "true");
    await expect(triggers.nth(1)).toHaveAttribute("aria-expanded", "true");
  });
});

