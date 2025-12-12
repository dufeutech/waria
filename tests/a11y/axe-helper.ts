import { Page, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

/**
 * Run axe-core accessibility checks on the page
 * Targets WCAG 2.1 AA compliance
 */
export async function checkA11y(
  page: Page,
  options?: {
    selector?: string;
    exclude?: string[];
    disableRules?: string[];
  }
): Promise<void> {
  let builder = new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']);

  if (options?.selector) {
    builder = builder.include(options.selector);
  }

  if (options?.exclude) {
    for (const selector of options.exclude) {
      builder = builder.exclude(selector);
    }
  }

  if (options?.disableRules) {
    builder = builder.disableRules(options.disableRules);
  }

  const results = await builder.analyze();

  if (results.violations.length > 0) {
    const violationMessages = results.violations.map((violation) => {
      const nodes = violation.nodes.map((node) =>
        `  - ${node.target.join(', ')}: ${node.failureSummary}`
      ).join('\n');
      return `${violation.id}: ${violation.description}\n${nodes}`;
    }).join('\n\n');

    throw new Error(`Accessibility violations found:\n\n${violationMessages}`);
  }

  expect(results.violations).toEqual([]);
}

/**
 * Test keyboard navigation pattern
 */
export async function testKeyboardNavigation(
  page: Page,
  config: {
    container: string;
    items: string;
    keys: Array<{ key: string; expectedIndex: number }>;
  }
): Promise<void> {
  const items = page.locator(config.items);

  // Focus first item
  await items.first().focus();

  for (const { key, expectedIndex } of config.keys) {
    await page.keyboard.press(key);
    const focused = await page.evaluate(() => document.activeElement);
    const expectedItem = await items.nth(expectedIndex).elementHandle();
    expect(await page.evaluate((el) => el === document.activeElement, expectedItem)).toBe(true);
  }
}

/**
 * Test focus trap behavior
 */
export async function testFocusTrap(
  page: Page,
  config: {
    container: string;
    firstFocusable: string;
    lastFocusable: string;
  }
): Promise<void> {
  const container = page.locator(config.container);
  const firstFocusable = container.locator(config.firstFocusable);
  const lastFocusable = container.locator(config.lastFocusable);

  // Focus last element and Tab - should wrap to first
  await lastFocusable.focus();
  await page.keyboard.press('Tab');
  await expect(firstFocusable).toBeFocused();

  // Focus first element and Shift+Tab - should wrap to last
  await page.keyboard.press('Shift+Tab');
  await expect(lastFocusable).toBeFocused();
}

/**
 * Verify ARIA attributes on an element
 */
export async function verifyAriaAttributes(
  page: Page,
  selector: string,
  expectedAttributes: Record<string, string | boolean>
): Promise<void> {
  const element = page.locator(selector);

  for (const [attr, value] of Object.entries(expectedAttributes)) {
    const attrName = attr.startsWith('aria-') ? attr : `aria-${attr}`;
    await expect(element).toHaveAttribute(attrName, String(value));
  }
}
