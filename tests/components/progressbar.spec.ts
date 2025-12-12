import { test, expect } from '@playwright/test';
import { checkA11y } from '../a11y/axe-helper';

test.describe('w-progressbar accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should have no axe violations', async ({ page }) => {
    const progressbar = page.locator('w-progressbar');
    if (await progressbar.count() > 0) {
      await checkA11y(page, { selector: 'w-progressbar' });
    }
  });

  test('should have role="progressbar"', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      await expect(progressbar).toHaveAttribute('role', 'progressbar');
    }
  });

  test('should have aria-valuenow attribute', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      const valueNow = await progressbar.getAttribute('aria-valuenow');
      expect(valueNow).toBeTruthy();
      const numValue = parseFloat(valueNow!);
      expect(numValue).toBeGreaterThanOrEqual(0);
    }
  });

  test('should have aria-valuemin attribute', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      const valueMin = await progressbar.getAttribute('aria-valuemin');
      expect(valueMin).toBeTruthy();
    }
  });

  test('should have aria-valuemax attribute', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      const valueMax = await progressbar.getAttribute('aria-valuemax');
      expect(valueMax).toBeTruthy();
    }
  });

  test('should support indeterminate state', async ({ page }) => {
    const progressbar = page.locator('w-progressbar[indeterminate]');

    if (await progressbar.count() > 0) {
      // Indeterminate progress bars should not have aria-valuenow
      const valueNow = await progressbar.first().getAttribute('aria-valuenow');
      expect(valueNow).toBeNull();
    }
  });

  test('should update aria-valuenow when value changes', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      // Get initial value
      const initialValue = await progressbar.getAttribute('aria-valuenow');

      // Change the value via JavaScript
      await progressbar.evaluate((el: HTMLElement & { value: number }) => {
        el.value = 75;
      });

      // Verify aria-valuenow updated
      await expect(progressbar).toHaveAttribute('aria-valuenow', '75');
    }
  });

  test('should have aria-label or aria-labelledby', async ({ page }) => {
    const progressbar = page.locator('w-progressbar').first();

    if (await progressbar.count() > 0) {
      const ariaLabel = await progressbar.getAttribute('aria-label');
      const ariaLabelledby = await progressbar.getAttribute('aria-labelledby');

      // Should have one of the label attributes
      expect(ariaLabel !== null || ariaLabelledby !== null).toBeTruthy();
    }
  });
});
