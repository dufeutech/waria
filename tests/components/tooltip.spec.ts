/**
 * w-tooltip - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper tooltip role
 * - 1.4.13 Content on Hover or Focus: Dismissible, hoverable, persistent
 * - 2.1.1 Keyboard: Focus triggers tooltip
 * - 4.1.2 Name, Role, Value: aria-describedby links trigger to tooltip
 */

import { test, expect } from "@playwright/test";
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
});
