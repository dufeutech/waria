import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-hover-card accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/hover-card", { waitUntil: "domcontentloaded" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    await checkA11y(page, { selector: "w-hover-card" });
  });

  test("should show content on focus", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    await trigger.focus();
    // Content is teleported to portal - verify via aria-expanded on trigger
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("should hide content on blur", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Tab");
    await page.waitForTimeout(400); // Wait for close delay
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("should close on Escape key", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    await page.keyboard.press("Escape");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("should have aria-expanded on trigger", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("should show content on mouse hover", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    await trigger.hover();

    // Wait for open delay (default 500ms)
    await page.waitForTimeout(600);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test("should hide content on mouse leave", async ({ page }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    // First show by hovering
    await trigger.hover();
    await page.waitForTimeout(600);
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    // Move mouse away from trigger
    await page.mouse.move(0, 0);

    // Wait for close delay (default 300ms)
    await page.waitForTimeout(400);
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("should have aria-controls linking trigger to content", async ({
    page,
  }) => {
    const hoverCard = page.locator("w-hover-card").first();
    const trigger = hoverCard.locator('[slot="trigger"]');

    // Show content to ensure aria-controls is set
    await trigger.focus();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");

    const ariaControls = await trigger.getAttribute("aria-controls");
    expect(ariaControls).toBeTruthy();
  });
});
