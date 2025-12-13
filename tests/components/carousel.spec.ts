/**
 * w-carousel - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 1.3.1 Info and Relationships: Carousel/slide roles
 * - 2.1.1 Keyboard: Full keyboard operability
 * - 4.1.2 Name, Role, Value: aria-roledescription, aria-label
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const CAROUSEL = `
<w-carousel label="Image carousel">
  <w-slot item name="1"><div>Slide 1</div></w-slot>
  <w-slot item name="2"><div>Slide 2</div></w-slot>
  <w-slot item name="3"><div>Slide 3</div></w-slot>
  <w-slot prev><button>Previous</button></w-slot>
  <w-slot next><button>Next</button></w-slot>
</w-carousel>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-carousel", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, CAROUSEL, "w-carousel");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-carousel" });
  });

  test('has role="group"', async ({ page }) => {
    const carousel = page.locator("w-carousel");
    await expect(carousel).toHaveAttribute("role", "group");
  });

  test('has aria-roledescription="carousel"', async ({ page }) => {
    const carousel = page.locator("w-carousel");
    await expect(carousel).toHaveAttribute("aria-roledescription", "carousel");
  });

  test("has aria-label", async ({ page }) => {
    const carousel = page.locator("w-carousel");
    await expect(carousel).toHaveAttribute("aria-label", "Image carousel");
  });

  test('slides have role="group" and aria-roledescription="slide"', async ({ page }) => {
    const items = page.locator('w-slot[item] > *');

    await expect(items.first()).toHaveAttribute("role", "group");
    await expect(items.first()).toHaveAttribute("aria-roledescription", "slide");
  });

  test("ArrowRight navigates to next slide", async ({ page }) => {
    const items = page.locator('w-slot[item] > *');

    await items.first().focus();
    await page.keyboard.press("ArrowRight");

    await expect(items.nth(1)).not.toHaveAttribute("hidden");
  });

  test("ArrowLeft navigates to previous slide", async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    const next = page.locator('w-slot[next] > *');

    // Navigate to second slide first
    await next.click();
    await items.nth(1).focus();
    await page.keyboard.press("ArrowLeft");

    await expect(items.first()).not.toHaveAttribute("hidden");
  });

  test("prev/next buttons navigate slides", async ({ page }) => {
    const items = page.locator('w-slot[item] > *');
    const next = page.locator('w-slot[next] > *');
    const prev = page.locator('w-slot[prev] > *');

    await next.click();
    await expect(items.nth(1)).not.toHaveAttribute("hidden");

    await prev.click();
    await expect(items.first()).not.toHaveAttribute("hidden");
  });

  test("emits change event on navigation", async ({ page }) => {
    const carousel = page.locator("w-carousel");
    const next = page.locator('w-slot[next] > *');

    const changePromise = carousel.evaluate((el) => {
      return new Promise<{ current: number; previous: number }>((resolve) => {
        el.addEventListener("change", (e: Event) => {
          resolve((e as CustomEvent).detail);
        }, { once: true });
      });
    });

    await next.click();

    const detail = await changePromise;
    expect(detail.previous).toBe(0);
    expect(detail.current).toBe(1);
  });
});
