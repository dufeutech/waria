import { test, expect } from "@playwright/test";
import { renderComponent } from "./test-utils";

const SCROLLBAR_HORIZONTAL = `
<w-scrollbar orientation="horizontal" style="width: 300px; padding: 1rem;">
  <div style="display: flex; gap: 1rem; width: max-content;">
    <div style="width: 150px; height: 100px; flex-shrink: 0;">A</div>
    <div style="width: 150px; height: 100px; flex-shrink: 0;">B</div>
    <div style="width: 150px; height: 100px; flex-shrink: 0;">C</div>
    <div style="width: 150px; height: 100px; flex-shrink: 0;">D</div>
    <div style="width: 150px; height: 100px; flex-shrink: 0;">E</div>
  </div>
</w-scrollbar>`;

const RANGE_HORIZONTAL = `
<w-range id="r" min="0" max="100" value="50" style="position: relative; height: 20px; display: block; width: 200px;">
  <w-slot rail>
    <div style="position: absolute; top: 50%; left: 0; right: 0; height: 4px; background: #ddd; transform: translateY(-50%);">
      <w-slot fill>
        <div style="background: #06c;"></div>
      </w-slot>
    </div>
  </w-slot>
  <w-slot knob>
    <div style="position: absolute; width: 20px; height: 20px; background: #06c; border-radius: 50%;"></div>
  </w-slot>
</w-range>`;

test("scrollbar horizontal: computed styles + wheel conversion", async ({ page }) => {
  await renderComponent(page, SCROLLBAR_HORIZONTAL, "w-scrollbar", "tabindex");

  const scrollbar = page.locator("w-scrollbar").first();

  const styles = await scrollbar.evaluate((el) => {
    const cs = getComputedStyle(el);
    return {
      display: cs.display,
      overflowX: cs.overflowX,
      overflowY: cs.overflowY,
      width: cs.width,
      scrollWidth: (el as HTMLElement).scrollWidth,
      clientWidth: (el as HTMLElement).clientWidth,
    };
  });
  console.log("scrollbar styles:", styles);

  const before = await scrollbar.evaluate((el) => el.scrollLeft);
  await scrollbar.evaluate((el) => {
    el.dispatchEvent(
      new WheelEvent("wheel", { deltaY: 100, deltaX: 0, bubbles: true, cancelable: true }),
    );
  });
  await page.waitForTimeout(50);
  const after = await scrollbar.evaluate((el) => el.scrollLeft);
  console.log("scrollLeft before/after:", before, "→", after);

  expect(styles.overflowX).toBe("auto");
  expect(after).toBeGreaterThan(before);
});

test("range fill width reflects --w-fill", async ({ page }) => {
  await renderComponent(page, RANGE_HORIZONTAL, "w-range", "aria-orientation");

  const range = page.locator("w-range#r");
  const fillVar = await range.evaluate((el) =>
    getComputedStyle(el).getPropertyValue("--w-fill"),
  );
  console.log("--w-fill on host:", JSON.stringify(fillVar));

  const fillEl = page.locator("w-range#r w-slot[fill] > *");
  const fillCount = await fillEl.count();
  console.log("fill element count:", fillCount);

  if (fillCount > 0) {
    const fillStyles = await fillEl.first().evaluate((el) => {
      const cs = getComputedStyle(el);
      return { width: cs.width, position: cs.position, left: cs.left, height: cs.height };
    });
    console.log("fill styles:", fillStyles);
  }
});
