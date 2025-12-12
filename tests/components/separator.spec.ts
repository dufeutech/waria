import { test, expect } from '@playwright/test';
import { checkA11y } from '../a11y/axe-helper';

test.describe('w-separator accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/', { waitUntil: 'domcontentloaded' });
  });

  test('should have no axe violations', async ({ page }) => {
    const separator = page.locator('w-separator');
    if (await separator.count() > 0) {
      await checkA11y(page, { selector: 'w-separator' });
    }
  });

  test('should have role="separator" by default', async ({ page }) => {
    const separator = page.locator('w-separator').first();

    if (await separator.count() > 0) {
      await expect(separator).toHaveAttribute('role', 'separator');
    }
  });

  test('should have aria-orientation attribute', async ({ page }) => {
    const separator = page.locator('w-separator').first();

    if (await separator.count() > 0) {
      const orientation = await separator.getAttribute('aria-orientation');
      expect(['horizontal', 'vertical']).toContain(orientation);
    }
  });

  test('should support horizontal orientation', async ({ page }) => {
    const separator = page.locator('w-separator[orientation="horizontal"]');

    if (await separator.count() > 0) {
      await expect(separator.first()).toHaveAttribute('aria-orientation', 'horizontal');
    }
  });

  test('should support vertical orientation', async ({ page }) => {
    const separator = page.locator('w-separator[orientation="vertical"]');

    if (await separator.count() > 0) {
      await expect(separator.first()).toHaveAttribute('aria-orientation', 'vertical');
    }
  });

  test('should not be focusable by default', async ({ page }) => {
    const separator = page.locator('w-separator').first();

    if (await separator.count() > 0) {
      const tabindex = await separator.getAttribute('tabindex');
      // Separator should not have positive tabindex (not focusable)
      expect(tabindex === null || tabindex === '-1').toBeTruthy();
    }
  });

  test('should support decorative mode with aria-hidden', async ({ page }) => {
    const separator = page.locator('w-separator[decorative]');

    if (await separator.count() > 0) {
      await expect(separator.first()).toHaveAttribute('aria-hidden', 'true');
    }
  });
});
