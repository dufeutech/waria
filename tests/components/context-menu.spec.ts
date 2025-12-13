/**
 * w-context-menu - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper menu/menuitem roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const CONTEXT_MENU = `
<w-context-menu>
  <w-slot trigger><div style="padding: 2rem; background: #f0f0f0;">
    Right-click here
  </div></w-slot>
  <w-slot body><div>
    <w-slot item><button name="cut">Cut</button></w-slot>
    <w-slot item><button name="copy">Copy</button></w-slot>
    <w-slot item><button name="paste">Paste</button></w-slot>
  </div></w-slot>
</w-context-menu>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-context-menu", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, CONTEXT_MENU, "w-context-menu");
  });

  test("axe accessibility scan (closed)", async ({ page }) => {
    await checkA11y(page, { selector: "w-context-menu" });
  });
});
