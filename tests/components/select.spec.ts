import { test, expect, Page } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";

// Helper to get visible listbox (works whether portaled or not)
function getVisibleListbox(page: Page) {
  return page.locator('[slot="listbox"][role="listbox"]:not([hidden])');
}

// Helper to get options in visible listbox
function getOptions(page: Page) {
  return page.locator(
    '[slot="listbox"][role="listbox"]:not([hidden]) [slot="option"]'
  );
}

test.describe("w-select accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/#/Select", { waitUntil: "domcontentloaded" });
    await page.waitForSelector("w-select", { state: "visible" });
  });

  test("should have no axe violations when closed", async ({ page }) => {
    const select = page.locator("w-select");
    if ((await select.count()) > 0) {
      await checkA11y(page, { selector: "w-select" });
    }
  });

  test("should have combobox role on trigger", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await expect(trigger).toHaveAttribute("role", "combobox");
    }
  });

  test('should have aria-haspopup="listbox" on trigger', async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await expect(trigger).toHaveAttribute("aria-haspopup", "listbox");
    }
  });

  test("should have aria-expanded on trigger", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await expect(trigger).toHaveAttribute("aria-expanded", "false");
    }
  });

  test("should open listbox on trigger click", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisibleListbox(page)).toBeVisible();
      await expect(trigger).toHaveAttribute("aria-expanded", "true");
    }
  });

  test('should have role="listbox" on options container', async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisibleListbox(page)).toHaveAttribute("role", "listbox");
    }
  });

  test('should have role="option" on options', async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      const options = getOptions(page);
      const count = await options.count();
      for (let i = 0; i < Math.min(count, 3); i++) {
        await expect(options.nth(i)).toHaveAttribute("role", "option");
      }
    }
  });

  test("should navigate options with arrow keys", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      const options = getOptions(page);
      if ((await options.count()) > 1) {
        await page.keyboard.press("ArrowDown");

        // First option should be focused/highlighted
        const firstOption = options.first();
        const ariaSelected = await firstOption.getAttribute("aria-selected");
        expect(
          ariaSelected === "true" ||
            (await firstOption.evaluate((el) => el === document.activeElement))
        ).toBeTruthy();
      }
    }
  });

  test("should select option on Enter", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      const options = getOptions(page);
      if ((await options.count()) > 0) {
        await page.keyboard.press("ArrowDown");
        await page.keyboard.press("Enter");

        // Listbox should close after selection (back in w-select and hidden)
        await expect(
          page.locator('w-select [slot="listbox"]').first()
        ).toBeHidden();
      }
    }
  });

  test("should close on Escape key", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await expect(getVisibleListbox(page)).toBeVisible();

      await page.keyboard.press("Escape");
      // After close, listbox is back in w-select and hidden
      await expect(
        page.locator('w-select [slot="listbox"]').first()
      ).toBeHidden();
    }
  });

  test("should select option on click", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      const options = getOptions(page);
      if ((await options.count()) > 0) {
        await options.first().click();

        // Listbox should close after selection (back in w-select and hidden)
        await expect(
          page.locator('w-select [slot="listbox"]').first()
        ).toBeHidden();
      }
    }
  });

  test("should emit change event on selection", async ({ page }) => {
    const select = page.locator("w-select").first();
    const trigger = select.locator('[slot="trigger"]');

    if ((await trigger.count()) > 0) {
      // Set up event listener before any interactions using page.evaluate
      // to avoid execution context issues
      await page.evaluate(() => {
        const selectEl = document.querySelector("w-select");
        if (selectEl) {
          (window as any).__selectChangeDetail = null;
          selectEl.addEventListener(
            "change",
            (e: Event) => {
              (window as any).__selectChangeDetail = (e as CustomEvent).detail;
            },
            { once: true }
          );
        }
      });

      await trigger.click();
      const options = getOptions(page);
      if ((await options.count()) > 0) {
        await options.first().click();

        // Wait a tick for the event to fire
        await page.waitForFunction(() => (window as any).__selectChangeDetail !== null, {
          timeout: 5000,
        });

        const detail = await page.evaluate(() => (window as any).__selectChangeDetail);
        expect(detail.value).toBeDefined();
      }
    }
  });

  test("should have no axe violations when open", async ({ page }) => {
    const trigger = page.locator('w-select [slot="trigger"]').first();

    if ((await trigger.count()) > 0) {
      await trigger.click();
      await checkA11y(page);
    }
  });
});
