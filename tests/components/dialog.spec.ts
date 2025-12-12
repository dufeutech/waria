import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-dialog accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Dialog", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-dialog", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    await checkA11y(page, { selector: "w-dialog" });
  });

  test("should have correct ARIA attributes on trigger", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');

    await expect(trigger).toHaveAttribute("aria-haspopup", "dialog");
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  });

  test("should open dialog on trigger click", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    // Content is teleported to portal when opened - use aria-modal to distinguish from popover
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await expect(content).toBeHidden();
    await trigger.click();
    await expect(content).toBeVisible();
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
  });

  test('should have role="dialog" on content', async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    // Content is teleported to portal when opened
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(content).toBeVisible();
    await expect(content).toHaveAttribute("role", "dialog");
    await expect(content).toHaveAttribute("aria-modal", "true");
  });

  test("should have no axe violations when open", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    await trigger.click();

    // Wait for dialog to be visible (content is teleported to portal)
    await expect(
      page.locator('[role="dialog"][aria-modal="true"]')
    ).toBeVisible();

    await checkA11y(page);
  });

  test("should close on Escape key", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(content).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(content).toBeHidden();
  });

  test("should close on close button click", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const content = page.locator('[role="dialog"][aria-modal="true"]');
    // Close button is inside the teleported content
    const closeBtn = content.locator('[slot="close"]');

    await trigger.click();
    await expect(content).toBeVisible();

    await closeBtn.click();
    await expect(content).toBeHidden();
  });

  test("should trap focus within dialog", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const dialog = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(dialog).toBeVisible();

    // The focused element should be within the dialog
    await expect(dialog.locator(":focus")).toBeVisible();
  });

  test("should return focus to trigger on close", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.click();
    await expect(content).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(content).toBeHidden();

    // Focus should return to trigger
    await expect(trigger).toBeFocused();
  });

  test("should open on Enter key", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.focus();
    await page.keyboard.press("Enter");
    await expect(content).toBeVisible();
  });

  test("should open on Space key", async ({ page }) => {
    const trigger = page.locator('w-dialog [slot="trigger"]');
    const content = page.locator('[role="dialog"][aria-modal="true"]');

    await trigger.focus();
    await page.keyboard.press("Space");
    await expect(content).toBeVisible();
  });
});
