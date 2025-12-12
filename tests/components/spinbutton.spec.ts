import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { gotoComponent, SLOT, KEY } from "../test-utils";

// Select demo spinbutton by label (not the one on Label page which has label="Quantity")
// The main Spinbutton page has "Quantity" too, so select the one with higher max value
const DEMO_SPINBUTTON = 'w-spinbutton[max="100"]';

test.describe("w-spinbutton accessibility", () => {
  test.beforeEach(async ({ page }) => {
    await gotoComponent(page, "Spinbutton");
    // Wait for demo spinbutton's input to be visible
    await page.waitForSelector(`${DEMO_SPINBUTTON} ${SLOT.input}`, {
      state: "visible",
      timeout: 10000,
    });
  });

  test("should have no axe violations", async ({ page }) => {
    await checkA11y(page, { selector: "w-spinbutton" });
  });

  test("should have correct ARIA role and attributes", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);

    await expect(input).toHaveAttribute("role", "spinbutton");
    await expect(input).toHaveAttribute("aria-valuemin");
    await expect(input).toHaveAttribute("aria-valuemax");
    await expect(input).toHaveAttribute("aria-valuenow");
  });

  test("should increment value with ArrowUp", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);

    await input.focus();
    const initialValue = await input.getAttribute("aria-valuenow");

    await page.keyboard.press(KEY.ArrowUp);

    const newValue = await input.getAttribute("aria-valuenow");
    expect(Number(newValue)).toBeGreaterThan(Number(initialValue));
  });

  test("should decrement value with ArrowDown", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);

    await input.focus();
    const initialValue = await input.getAttribute("aria-valuenow");

    await page.keyboard.press(KEY.ArrowDown);

    const newValue = await input.getAttribute("aria-valuenow");
    expect(Number(newValue)).toBeLessThan(Number(initialValue));
  });

  test("should go to min value with Home key", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);
    const min = await spinbutton.getAttribute("min");

    await input.focus();
    await page.keyboard.press(KEY.Home);

    const newValue = await input.getAttribute("aria-valuenow");
    expect(newValue).toBe(min);
  });

  test("should go to max value with End key", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);
    const max = await spinbutton.getAttribute("max");

    await input.focus();
    await page.keyboard.press(KEY.End);

    const newValue = await input.getAttribute("aria-valuenow");
    expect(newValue).toBe(max);
  });

  test("should increment with increment button click", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);
    const incrementBtn = spinbutton.locator(SLOT.increment);

    const initialValue = await input.getAttribute("aria-valuenow");
    await incrementBtn.click();

    const newValue = await input.getAttribute("aria-valuenow");
    expect(Number(newValue)).toBeGreaterThan(Number(initialValue));
  });

  test("should decrement with decrement button click", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);
    const decrementBtn = spinbutton.locator(SLOT.decrement);

    const initialValue = await input.getAttribute("aria-valuenow");
    await decrementBtn.click();

    const newValue = await input.getAttribute("aria-valuenow");
    expect(Number(newValue)).toBeLessThan(Number(initialValue));
  });

  test("should support PageUp for larger increments", async ({ page }) => {
    const spinbutton = page.locator(DEMO_SPINBUTTON);
    const input = spinbutton.locator(SLOT.input);

    await input.focus();
    const initialValue = Number(await input.getAttribute("aria-valuenow"));

    await page.keyboard.press(KEY.PageUp);

    const newValue = Number(await input.getAttribute("aria-valuenow"));
    // PageUp should increment by more than 1 step
    expect(newValue - initialValue).toBeGreaterThan(1);
  });
});
