/**
 * w-popover - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper dialog role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.1.2 No Keyboard Trap: Escape closes popover
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const POPOVER = `
<w-popover>
  <w-slot trigger><button>Open Popover</button></w-slot>
  <w-slot body><div label="Popover content">
    <h4>Popover Title</h4>
    <p>This is popover content.</p>
  </div></w-slot>
</w-popover>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-popover", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, POPOVER, "w-popover");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-popover" });
  });

  test("trigger has aria-haspopup", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
  });

  test("trigger has aria-expanded false when closed", async ({ page }) => {
    const trigger = page.locator('w-slot[trigger] > *');
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
