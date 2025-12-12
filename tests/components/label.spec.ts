/**
 * w-label - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Label association with form controls
 * - 2.4.6 Headings and Labels: Descriptive labels
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const LABEL_WITH_INPUT = `
<w-label for="test-input">Username</w-label>
<input id="test-input" type="text" />`;

const LABEL_REQUIRED = `
<w-label for="test-input" required>Email</w-label>
<input id="test-input" type="email" />`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-label", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, LABEL_WITH_INPUT, "w-label");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-label" });
  });

  test("associates label with control via for attribute", async ({ page }) => {
    const label = page.locator("w-label");
    const forAttr = await label.getAttribute("for");
    expect(forAttr).toBe("test-input");

    const control = page.locator(`#${forAttr}`);
    await expect(control).toBeVisible();
  });

  test("click focuses associated control", async ({ page }) => {
    const label = page.locator("w-label");
    const input = page.locator("#test-input");

    await label.click();
    await expect(input).toBeFocused();
  });
});

test.describe("w-label required", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, LABEL_REQUIRED, "w-label");
  });

  test("indicates required state", async ({ page }) => {
    const label = page.locator("w-label");
    const hasRequired = await label.evaluate((el) => {
      const text = el.textContent || "";
      const afterContent = getComputedStyle(el, "::after").content;
      return text.includes("*") || afterContent.includes("*") || el.hasAttribute("required");
    });
    expect(hasRequired).toBeTruthy();
  });
});
