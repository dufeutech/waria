/**
 * w-choice - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper radiogroup/radio roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-checked state
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const CHOICE_RADIO = `
<w-choice mode="radio" label="Select option">
  <button slot="option" name="a">Option A</button>
  <button slot="option" name="b">Option B</button>
  <button slot="option" name="c">Option C</button>
</w-choice>`;

const CHOICE_CHECKBOX = `
<w-choice mode="checkbox" label="Select options">
  <button slot="option" name="a">Option A</button>
  <button slot="option" name="b">Option B</button>
  <button slot="option" name="c">Option C</button>
</w-choice>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-choice radio", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, CHOICE_RADIO, "w-choice");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-choice" });
  });

  test('has role="radiogroup"', async ({ page }) => {
    const choice = page.locator("w-choice");
    await expect(choice).toHaveAttribute("role", "radiogroup");
  });

  test('options have role="radio"', async ({ page }) => {
    const options = page.locator('[slot="option"]');
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      await expect(options.nth(i)).toHaveAttribute("role", "radio");
    }
  });

  test("options have aria-checked", async ({ page }) => {
    const options = page.locator('[slot="option"]');
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      const checked = await options.nth(i).getAttribute("aria-checked");
      expect(["true", "false"]).toContain(checked);
    }
  });

  test("click updates aria-checked", async ({ page }) => {
    const options = page.locator('[slot="option"]');

    await options.first().click();
    await expect(options.first()).toHaveAttribute("aria-checked", "true");

    await options.nth(1).click();
    await expect(options.first()).toHaveAttribute("aria-checked", "false");
    await expect(options.nth(1)).toHaveAttribute("aria-checked", "true");
  });

  test("arrow keys navigate options", async ({ page }) => {
    const options = page.locator('[slot="option"]');
    await testArrowNav(page, options, { horizontal: false });
  });

  test("Enter key selects option", async ({ page }) => {
    const options = page.locator('[slot="option"]');

    await options.first().focus();
    await page.keyboard.press("Enter");

    await expect(options.first()).toHaveAttribute("aria-checked", "true");
  });

  test("Space key selects option", async ({ page }) => {
    const options = page.locator('[slot="option"]');

    await options.first().focus();
    await page.keyboard.press("Space");

    await expect(options.first()).toHaveAttribute("aria-checked", "true");
  });

  test("has aria-orientation", async ({ page }) => {
    const choice = page.locator("w-choice");
    const orientation = await choice.getAttribute("aria-orientation");
    expect(["horizontal", "vertical"]).toContain(orientation);
  });

  test("emits change event", async ({ page }) => {
    const choice = page.locator("w-choice");
    const options = page.locator('[slot="option"]');

    const changePromise = choice.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener("change", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await options.first().click();

    const detail = await changePromise;
    expect(detail.value).toBeTruthy();
  });
});

test.describe("w-choice checkbox", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, CHOICE_CHECKBOX, "w-choice");
  });

  test('has role="group"', async ({ page }) => {
    const choice = page.locator("w-choice");
    await expect(choice).toHaveAttribute("role", "group");
  });

  test('options have role="checkbox"', async ({ page }) => {
    const options = page.locator('[slot="option"]');

    await expect(options.first()).toHaveAttribute("role", "checkbox");
  });

  test("allows multiple selections", async ({ page }) => {
    const options = page.locator('[slot="option"]');

    await options.first().click();
    await options.nth(1).click();

    await expect(options.first()).toHaveAttribute("aria-checked", "true");
    await expect(options.nth(1)).toHaveAttribute("aria-checked", "true");
  });
});
