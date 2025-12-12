/**
 * w-select - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper combobox/listbox roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SELECT = `
<w-select label="Choose an option">
  <button slot="trigger">Select...</button>
  <div slot="listbox">
    <button slot="option" name="a">Option A</button>
    <button slot="option" name="b">Option B</button>
    <button slot="option" name="c">Option C</button>
  </div>
</w-select>`;

// ═══════════════════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════════════════

const getVisibleListbox = (page: Page) =>
  page.locator('[slot="listbox"][role="listbox"]:not([hidden])');
const getOptions = (page: Page) =>
  page.locator('[slot="listbox"][role="listbox"]:not([hidden]) [slot="option"]');

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-select", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, SELECT, "w-select");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-select" });
  });

  test('trigger has role="combobox"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("role", "combobox");
  });

  test('trigger has aria-haspopup="listbox"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
  });

  test("trigger has aria-expanded false when closed", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("click opens listbox", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleListbox(page)).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('listbox has role="listbox"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleListbox(page)).toHaveAttribute("role", "listbox");
  });

  test('options have role="option"', async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    const options = getOptions(page);
    const count = await options.count();

    for (let i = 0; i < count; i++) {
      await expect(options.nth(i)).toHaveAttribute("role", "option");
    }
  });

  test("arrow keys navigate options", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await page.keyboard.press("ArrowDown");

    const options = getOptions(page);
    const firstOption = options.first();
    const selected = await firstOption.getAttribute("aria-selected");

    expect(selected === "true" || await firstOption.evaluate(el => el === document.activeElement)).toBeTruthy();
  });

  test("Enter selects option", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("Enter");

    await expect(page.locator('w-select [slot="listbox"]')).toHaveAttribute("hidden", "");
  });

  test("Escape closes listbox", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await expect(getVisibleListbox(page)).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(page.locator('w-select [slot="listbox"]')).toHaveAttribute("hidden", "");
  });

  test("option click selects and closes", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');

    await trigger.click();
    await getOptions(page).first().click();

    await expect(page.locator('w-select [slot="listbox"]')).toHaveAttribute("hidden", "");
  });

  test("emits change event on selection", async ({ page }) => {
    const select = page.locator("w-select");
    const trigger = page.locator('[slot="trigger"]');

    const changePromise = select.evaluate((el) => {
      return new Promise<{ value: string }>((resolve) => {
        el.addEventListener("change", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await trigger.click();
    await getOptions(page).first().click();

    const detail = await changePromise;
    expect(detail.value).toBeDefined();
  });

  test("axe accessibility scan (open)", async ({ page }) => {
    const trigger = page.locator('[slot="trigger"]');
    await trigger.click();
    await expect(getVisibleListbox(page)).toBeVisible();
    await checkA11y(page);
  });
});
