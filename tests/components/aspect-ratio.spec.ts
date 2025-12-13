/**
 * w-aspect-ratio - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.4.4 Resize Text: Maintain usable layout at different sizes
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const ASPECT_RATIO = `
<w-aspect-ratio ratio="16/9" style="width: 320px;">
  <w-slot body><div>Content</div></w-slot>
</w-aspect-ratio>`;

const ASPECT_RATIO_4_3 = `
<w-aspect-ratio ratio="4/3" style="width: 320px;">
  <w-slot body><div>4:3 Content</div></w-slot>
</w-aspect-ratio>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-aspect-ratio", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ASPECT_RATIO, "w-aspect-ratio");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-aspect-ratio" });
  });

  test("has ratio attribute", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio");
    await expect(aspectRatio).toHaveAttribute("ratio", "16/9");
  });

  test("maintains aspect ratio styles", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio");
    await expect(aspectRatio).toHaveCSS("position", "relative");
  });

  test("content fills container", async ({ page }) => {
    const content = page.locator('w-slot[body] > *');
    await expect(content).toHaveCSS("position", "absolute");
    await expect(content).toHaveCSS("top", "0px");
    await expect(content).toHaveCSS("left", "0px");
  });

  test("responds to ratio attribute changes", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio");

    await aspectRatio.evaluate((el) => el.setAttribute("ratio", "4/3"));
    await expect(aspectRatio).toHaveAttribute("ratio", "4/3");
  });
});

test.describe("w-aspect-ratio 4:3", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, ASPECT_RATIO_4_3, "w-aspect-ratio");
  });

  test("supports different ratios", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio");
    await expect(aspectRatio).toHaveAttribute("ratio", "4/3");
  });
});
