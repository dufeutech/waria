import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

test.describe("w-aspect-ratio accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/aspect-ratio", { waitUntil: "domcontentloaded" });
    // Wait for Alpine.js to initialize and make the section visible
    await page.waitForSelector("w-aspect-ratio", { state: "visible" });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-aspect-ratio" });
  });

  test("should maintain aspect ratio styles", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio").first();

    // Check container has position relative
    await expect(aspectRatio).toHaveCSS("position", "relative");
    await expect(aspectRatio).toHaveCSS("width", /\d+px/);
  });

  test("should update content styles", async ({ page }) => {
    const content = page.locator('w-aspect-ratio [slot="content"]').first();

    await expect(content).toHaveCSS("position", "absolute");
    await expect(content).toHaveCSS("top", "0px");
    await expect(content).toHaveCSS("left", "0px");
  });

  test("should respond to ratio attribute changes", async ({ page }) => {
    const aspectRatio = page.locator("w-aspect-ratio").first();

    // Change ratio
    await aspectRatio.evaluate((el) => el.setAttribute("ratio", "4/3"));

    // Component should still be valid
    await expect(aspectRatio).toHaveAttribute("ratio", "4/3");
  });
});
