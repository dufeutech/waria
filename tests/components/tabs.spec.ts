/**
 * w-tabs - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper ARIA roles/relationships
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 2.4.3 Focus Order: Logical tab sequence
 * - 4.1.2 Name, Role, Value: Proper ARIA states
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent, testArrowNav, testHomeEnd } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const TABS = `
<w-tabs value="tab1">
  <w-slot list><div>
    <w-slot tab><button name="tab1">Tab 1</button></w-slot>
    <w-slot tab><button name="tab2">Tab 2</button></w-slot>
    <w-slot tab><button name="tab3">Tab 3</button></w-slot>
  </div></w-slot>
  <w-slot panels><div>
    <w-slot panel><div name="tab1">Content 1</div></w-slot>
    <w-slot panel><div name="tab2">Content 2</div></w-slot>
    <w-slot panel><div name="tab3">Content 3</div></w-slot>
  </div></w-slot>
</w-tabs>`;

const TABS_VERTICAL = `
<w-tabs value="tab1" orientation="vertical">
  <w-slot list><div>
    <w-slot tab><button name="tab1">Tab 1</button></w-slot>
    <w-slot tab><button name="tab2">Tab 2</button></w-slot>
    <w-slot tab><button name="tab3">Tab 3</button></w-slot>
  </div></w-slot>
  <w-slot panels><div>
    <w-slot panel><div name="tab1">Content 1</div></w-slot>
    <w-slot panel><div name="tab2">Content 2</div></w-slot>
    <w-slot panel><div name="tab3">Content 3</div></w-slot>
  </div></w-slot>
</w-tabs>`;

const TABS_NESTED = `
<w-tabs value="outer1">
  <w-slot list><div>
    <w-slot tab><button name="outer1">Outer 1</button></w-slot>
    <w-slot tab><button name="outer2">Outer 2</button></w-slot>
  </div></w-slot>
  <w-slot panels><div>
    <w-slot panel><div name="outer1">
      <w-tabs value="inner1">
        <w-slot list><div>
          <w-slot tab><button name="inner1">Inner A</button></w-slot>
          <w-slot tab><button name="inner2">Inner B</button></w-slot>
        </div></w-slot>
        <w-slot panels><div>
          <w-slot panel><div name="inner1">Inner content A</div></w-slot>
          <w-slot panel><div name="inner2">Inner content B</div></w-slot>
        </div></w-slot>
      </w-tabs>
    </div></w-slot>
    <w-slot panel><div name="outer2">Outer content 2</div></w-slot>
  </div></w-slot>
</w-tabs>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Horizontal Tabs
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-tabs", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TABS, "w-tabs");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-tabs" });
  });

  test("tablist has correct role", async ({ page }) => {
    const tablist = page.locator('w-slot[list] > *');
    await expect(tablist).toHaveAttribute("role", "tablist");
    await expect(tablist).toHaveAttribute("aria-orientation", "horizontal");
  });

  test("tabs have correct ARIA attributes", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    const count = await tabs.count();

    for (let i = 0; i < count; i++) {
      await expect(tabs.nth(i)).toHaveAttribute("role", "tab");
    }
    await expect(tabs.first()).toHaveAttribute("aria-selected", "true");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "false");
  });

  test("views have correct ARIA attributes", async ({ page }) => {
    const views = page.locator('w-slot[panel] > *');
    const count = await views.count();

    for (let i = 0; i < count; i++) {
      await expect(views.nth(i)).toHaveAttribute("role", "tabpanel");
    }
  });

  test("aria-controls links tab to view", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    const views = page.locator('w-slot[panel] > *');

    const ariaControls = await tabs.first().getAttribute("aria-controls");
    const viewId = await views.first().getAttribute("id");
    expect(ariaControls).toBe(viewId);
  });

  test("aria-labelledby links view to tab", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    const views = page.locator('w-slot[panel] > *');

    const tabId = await tabs.first().getAttribute("id");
    const labelledby = await views.first().getAttribute("aria-labelledby");
    expect(labelledby).toBe(tabId);
  });

  test("click switches active tab", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');

    await tabs.nth(1).click();
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
    await expect(tabs.first()).toHaveAttribute("aria-selected", "false");
  });

  test("non-selected views are hidden", async ({ page }) => {
    const views = page.locator('w-slot[panel] > *');

    await expect(views.first()).not.toHaveAttribute("hidden");
    await expect(views.nth(1)).toHaveAttribute("hidden", "");
    await expect(views.nth(2)).toHaveAttribute("hidden", "");
  });

  test("arrow keys navigate tabs", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    await testArrowNav(page, tabs, { horizontal: true });
  });

  test("Home/End keys navigate to first/last", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    await testHomeEnd(page, tabs);
  });

  test("Enter activates focused tab", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');

    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Enter");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  });

  test("Space activates focused tab", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');

    await tabs.first().focus();
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("Space");
    await expect(tabs.nth(1)).toHaveAttribute("aria-selected", "true");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Vertical Tabs
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-tabs vertical", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TABS_VERTICAL, "w-tabs");
  });

  test("has vertical orientation", async ({ page }) => {
    const tablist = page.locator('w-slot[list] > *');
    await expect(tablist).toHaveAttribute("aria-orientation", "vertical");
  });

  test("ArrowUp/Down navigate tabs", async ({ page }) => {
    const tabs = page.locator('w-slot[tab] > *');
    await testArrowNav(page, tabs, { horizontal: false });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Tests - Nested Tabs
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-tabs nested", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, TABS_NESTED, "w-tabs");
    // Wait for both tab groups to initialize
    await page.waitForFunction(() => {
      const tablists = document.querySelectorAll('w-slot[list][role="tablist"]');
      return tablists.length === 2;
    });
  });

  test("outer and inner have separate tablists", async ({ page }) => {
    const tablists = page.locator('w-slot[list][role="tablist"] > *');
    await expect(tablists).toHaveCount(2);
  });

  test("outer tabs control outer views only", async ({ page }) => {
    const outer = page.locator("w-tabs").first();
    const outerTabs = outer.locator("> w-slot[list] > * w-slot[tab] > *");

    await expect(outerTabs).toHaveCount(2);
    await expect(outerTabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("inner tabs control inner views only", async ({ page }) => {
    const inner = page.locator("w-tabs w-tabs");
    const innerTabs = inner.locator("w-slot[list] > * w-slot[tab] > *");

    await expect(innerTabs).toHaveCount(2);
    await expect(innerTabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("clicking outer tab does not affect inner", async ({ page }) => {
    const outer = page.locator("w-tabs").first();
    const outerTabs = outer.locator("> w-slot[list] > * w-slot[tab] > *");
    const inner = page.locator("w-tabs w-tabs");
    const innerTabs = inner.locator("w-slot[list] > * w-slot[tab] > *");

    await outerTabs.nth(1).click();
    await expect(innerTabs.first()).toHaveAttribute("aria-selected", "true");
  });

  test("clicking inner tab does not affect outer", async ({ page }) => {
    const outer = page.locator("w-tabs").first();
    const outerTabs = outer.locator("> w-slot[list] > * w-slot[tab] > *");
    const inner = page.locator("w-tabs w-tabs");
    const innerTabs = inner.locator("w-slot[list] > * w-slot[tab] > *");

    await innerTabs.nth(1).click();
    await expect(outerTabs.first()).toHaveAttribute("aria-selected", "true");
  });
});
