import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-collapsible accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Collapsible", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-collapsible", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-collapsible" });
  });

  test("should have aria-expanded on trigger", async ({ page }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]');

    if ((await trigger.count()) > 0) {
      const ariaExpanded = await trigger.first().getAttribute("aria-expanded");
      expect(["true", "false"]).toContain(ariaExpanded);
    }
  });

  test("should have aria-controls linking trigger to content", async ({
    page,
  }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]').first();
    const content = page.locator('w-collapsible [slot="content"]').first();

    if ((await trigger.count()) > 0 && (await content.count()) > 0) {
      const ariaControls = await trigger.getAttribute("aria-controls");
      expect(ariaControls).toBeTruthy();

      const contentId = await content.getAttribute("id");
      expect(ariaControls).toBe(contentId);
    }
  });

  test("should toggle content on trigger click", async ({ page }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]').first();
    const content = page.locator('w-collapsible [slot="content"]').first();

    if ((await trigger.count()) > 0) {
      // Get initial state
      const initialExpanded = await trigger.getAttribute("aria-expanded");

      // Click to toggle
      await trigger.click();

      const newExpanded = await trigger.getAttribute("aria-expanded");
      expect(newExpanded).not.toBe(initialExpanded);
    }
  });

  test("should toggle on Enter key", async ({ page }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      const initialExpanded = await trigger.getAttribute("aria-expanded");

      await page.keyboard.press("Enter");

      const newExpanded = await trigger.getAttribute("aria-expanded");
      expect(newExpanded).not.toBe(initialExpanded);
    }
  });

  test("should toggle on Space key", async ({ page }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.focus();
      const initialExpanded = await trigger.getAttribute("aria-expanded");

      await page.keyboard.press("Space");

      const newExpanded = await trigger.getAttribute("aria-expanded");
      expect(newExpanded).not.toBe(initialExpanded);
    }
  });

  test('should have role="region" on content when expanded', async ({
    page,
  }) => {
    const trigger = page.locator('w-collapsible [slot="trigger"]').first();
    const content = page.locator('w-collapsible [slot="content"]').first();

    if ((await trigger.count()) > 0) {
      // Expand if needed
      const expanded = await trigger.getAttribute("aria-expanded");
      if (expanded === "false") {
        await trigger.click();
      }

      await expect(content).toHaveAttribute("role", "region");
    }
  });

  test("should emit toggle event", async ({ page }) => {
    const collapsible = page.locator("w-collapsible").first();
    const trigger = collapsible.locator('[slot="trigger"]');

    if ((await trigger.count()) > 0) {
      const togglePromise = collapsible.evaluate((el) => {
        return new Promise<{ open: boolean }>((resolve) => {
          el.addEventListener(
            "toggle",
            (e: Event) => {
              resolve((e as CustomEvent).detail);
            },
            { once: true }
          );
        });
      });

      await trigger.click();

      const detail = await togglePromise;
      expect(typeof detail.open).toBe("boolean");
    }
  });
});
