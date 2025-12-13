/**
 * w-split - WAI-ARIA Window Splitter Pattern Compliance Tests
 *
 * WAI-ARIA Requirements (https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/):
 * - role="separator" on resizer elements
 * - aria-valuenow, aria-valuemin, aria-valuemax for position
 * - aria-orientation for separator direction
 * - aria-controls referencing primary pane
 * - Full keyboard navigation (Arrow keys, Home, End, Enter)
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Proper separator role
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: Proper ARIA attributes
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { render } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const SPLIT_HORIZONTAL = `
<w-split direction="horizontal" style="width: 600px; height: 300px;">
  <w-slot item name="left" data-size="200px" data-min="100px">
    <div id="pane-left">Left Panel</div>
  </w-slot>
  <w-slot item name="right">
    <div id="pane-right">Right Panel</div>
  </w-slot>
</w-split>`;

const SPLIT_VERTICAL = `
<w-split direction="vertical" style="width: 400px; height: 400px;">
  <w-slot item name="top" data-size="200px" data-min="100px">
    <div id="pane-top">Top Panel</div>
  </w-slot>
  <w-slot item name="bottom">
    <div id="pane-bottom">Bottom Panel</div>
  </w-slot>
</w-split>`;

const SPLIT_THREE_PANES = `
<w-split direction="horizontal" style="width: 900px; height: 300px;">
  <w-slot item name="left" data-size="200px" data-min="100px">
    <div>Left</div>
  </w-slot>
  <w-slot item name="center">
    <div>Center</div>
  </w-slot>
  <w-slot item name="right" data-size="200px" data-min="100px">
    <div>Right</div>
  </w-slot>
</w-split>`;

const SPLIT_NESTED = `
<w-split direction="horizontal" style="width: 800px; height: 400px;">
  <w-slot item name="sidebar" data-size="200px" data-min="100px">
    <div>Sidebar</div>
  </w-slot>
  <w-slot item name="main">
    <w-split direction="vertical" style="height: 100%;">
      <w-slot item name="editor">
        <div>Editor</div>
      </w-slot>
      <w-slot item name="panel" data-size="100px" data-min="50px">
        <div>Panel</div>
      </w-slot>
    </w-split>
  </w-slot>
</w-split>`;

// ═══════════════════════════════════════════════════════════════════════════
// Helper Functions
// ═══════════════════════════════════════════════════════════════════════════

async function waitForSplitInit(page: any) {
  // Wait for resizer to be created with role="separator"
  await page.waitForSelector('.w-split-resizer[role="separator"]', { timeout: 5000 });
}

// ═══════════════════════════════════════════════════════════════════════════
// Horizontal Split Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-split horizontal", () => {
  test.beforeEach(async ({ page }) => {
    await render(page, SPLIT_HORIZONTAL);
    await waitForSplitInit(page);
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-split" });
  });

  test("creates resizer with role=separator", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');
    await expect(resizer).toHaveAttribute("role", "separator");
  });

  test("resizer has correct ARIA attributes", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await expect(resizer).toHaveAttribute("tabindex", "0");
    await expect(resizer).toHaveAttribute("aria-valuemin");
    await expect(resizer).toHaveAttribute("aria-valuemax");
    await expect(resizer).toHaveAttribute("aria-valuenow");
    await expect(resizer).toHaveAttribute("aria-controls");
    await expect(resizer).toHaveAttribute("aria-label");
  });

  test("resizer has vertical orientation for horizontal split", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');
    // Horizontal split = vertical separator (moves left/right)
    await expect(resizer).toHaveAttribute("aria-orientation", "vertical");
  });

  test("ArrowRight increases primary pane size", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowRight");
    const newValue = Number(await resizer.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("ArrowLeft decreases primary pane size", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowLeft");
    const newValue = Number(await resizer.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });

  test("Home collapses pane to minimum", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    await page.keyboard.press("Home");

    const value = Number(await resizer.getAttribute("aria-valuenow"));
    const minValue = Number(await resizer.getAttribute("aria-valuemin"));

    expect(value).toBe(minValue);
  });

  test("End expands pane to maximum", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    await page.keyboard.press("End");

    const value = Number(await resizer.getAttribute("aria-valuenow"));
    const maxValue = Number(await resizer.getAttribute("aria-valuemax"));

    expect(value).toBe(maxValue);
  });

  test("Enter toggles collapse/restore", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    // First Enter should collapse
    await page.keyboard.press("Enter");
    const collapsedValue = Number(await resizer.getAttribute("aria-valuenow"));
    const minValue = Number(await resizer.getAttribute("aria-valuemin"));
    expect(collapsedValue).toBe(minValue);

    // Second Enter should restore
    await page.keyboard.press("Enter");
    const restoredValue = Number(await resizer.getAttribute("aria-valuenow"));
    expect(restoredValue).toBeGreaterThan(minValue);
  });

  test("respects minimum size constraint", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();

    // Press ArrowLeft many times to try to go below minimum
    for (let i = 0; i < 20; i++) {
      await page.keyboard.press("ArrowLeft");
    }

    const value = Number(await resizer.getAttribute("aria-valuenow"));
    const minValue = Number(await resizer.getAttribute("aria-valuemin"));

    expect(value).toBeGreaterThanOrEqual(minValue);
  });

  test("emits resize event on drag end", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');
    const split = page.locator('w-split');

    // Set up event listener
    await page.evaluate(() => {
      const split = document.querySelector("w-split");
      (window as any).__resizeEventReceived = false;
      split?.addEventListener("resize", () => {
        (window as any).__resizeEventReceived = true;
      }, { once: true });
    });

    // Perform drag operation
    const box = await resizer.boundingBox();
    if (!box) throw new Error("Resizer not found");

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 50, box.y + box.height / 2);
    await page.mouse.up();

    // Check if event was received
    const eventReceived = await page.evaluate(() => (window as any).__resizeEventReceived);
    expect(eventReceived).toBe(true);
  });

  test("getSizes returns current pane sizes", async ({ page }) => {
    const sizes = await page.evaluate(() => {
      const split = document.querySelector("w-split") as any;
      return split?.getSizes?.();
    });

    expect(sizes).toBeTruthy();
    expect(sizes).toHaveProperty("left");
    expect(sizes).toHaveProperty("right");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Vertical Split Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-split vertical", () => {
  test.beforeEach(async ({ page }) => {
    await render(page, SPLIT_VERTICAL);
    await waitForSplitInit(page);
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-split" });
  });

  test("resizer has horizontal orientation for vertical split", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');
    // Vertical split = horizontal separator (moves up/down)
    await expect(resizer).toHaveAttribute("aria-orientation", "horizontal");
  });

  test("ArrowDown increases primary pane size", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowDown");
    const newValue = Number(await resizer.getAttribute("aria-valuenow"));

    expect(newValue).toBeGreaterThan(initialValue);
  });

  test("ArrowUp decreases primary pane size", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowUp");
    const newValue = Number(await resizer.getAttribute("aria-valuenow"));

    expect(newValue).toBeLessThan(initialValue);
  });

  test("ArrowLeft/ArrowRight do not affect vertical split", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');

    await resizer.focus();
    const initialValue = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowLeft");
    const afterLeft = Number(await resizer.getAttribute("aria-valuenow"));

    await page.keyboard.press("ArrowRight");
    const afterRight = Number(await resizer.getAttribute("aria-valuenow"));

    expect(afterLeft).toBe(initialValue);
    expect(afterRight).toBe(initialValue);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Three Pane Split Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-split three panes", () => {
  test.beforeEach(async ({ page }) => {
    await render(page, SPLIT_THREE_PANES);
    await waitForSplitInit(page);
  });

  test("creates two resizers for three panes", async ({ page }) => {
    const resizers = page.locator('.w-split-resizer');
    await expect(resizers).toHaveCount(2);
  });

  test("each resizer has correct ARIA attributes", async ({ page }) => {
    const resizers = page.locator('.w-split-resizer');
    const count = await resizers.count();

    for (let i = 0; i < count; i++) {
      const resizer = resizers.nth(i);
      await expect(resizer).toHaveAttribute("role", "separator");
      await expect(resizer).toHaveAttribute("tabindex", "0");
      await expect(resizer).toHaveAttribute("aria-valuenow");
    }
  });

  test("resizers are independently controllable", async ({ page }) => {
    const resizers = page.locator('.w-split-resizer');

    // Control first resizer
    await resizers.first().focus();
    const initial1 = Number(await resizers.first().getAttribute("aria-valuenow"));
    await page.keyboard.press("ArrowRight");
    const after1 = Number(await resizers.first().getAttribute("aria-valuenow"));
    expect(after1).toBeGreaterThan(initial1);

    // Control second resizer
    await resizers.nth(1).focus();
    const initial2 = Number(await resizers.nth(1).getAttribute("aria-valuenow"));
    await page.keyboard.press("ArrowLeft");
    const after2 = Number(await resizers.nth(1).getAttribute("aria-valuenow"));
    expect(after2).toBeLessThan(initial2);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Nested Split Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-split nested", () => {
  test.beforeEach(async ({ page }) => {
    await render(page, SPLIT_NESTED);
    await waitForSplitInit(page);
  });

  test("nested splits have independent resizers", async ({ page }) => {
    // Outer split (horizontal) should have vertical separator
    const outerResizer = page.locator('w-split[direction="horizontal"] > .w-split-resizer');
    await expect(outerResizer.first()).toHaveAttribute("aria-orientation", "vertical");

    // Inner split (vertical) should have horizontal separator
    const innerResizer = page.locator('w-split[direction="vertical"] > .w-split-resizer');
    await expect(innerResizer.first()).toHaveAttribute("aria-orientation", "horizontal");
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Focus Management Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-split focus management", () => {
  test.beforeEach(async ({ page }) => {
    await render(page, SPLIT_HORIZONTAL);
    await waitForSplitInit(page);
  });

  test("resizer is focusable via Tab", async ({ page }) => {
    // Focus an element before the split
    await page.evaluate(() => {
      const div = document.createElement("button");
      div.id = "before-split";
      div.textContent = "Before";
      document.querySelector("w-split")?.before(div);
      div.focus();
    });

    await page.keyboard.press("Tab");

    const resizer = page.locator('.w-split-resizer');
    await expect(resizer).toBeFocused();
  });

  test("focus is visible on resizer", async ({ page }) => {
    const resizer = page.locator('.w-split-resizer');
    await resizer.focus();
    await expect(resizer).toBeFocused();
  });
});
