/**
 * w-link - WCAG 2.1 AA Compliance Tests
 *
 * WCAG Requirements:
 * - 2.4.4 Link Purpose: Accessible link text
 * - 2.1.1 Keyboard: Full keyboard operability
 */

import { test, expect } from "@playwright/test";
import { checkA11y } from "../a11y/axe-helper";
import { renderComponent } from "../test-utils";

// ═══════════════════════════════════════════════════════════════════════════
// Fixtures
// ═══════════════════════════════════════════════════════════════════════════

const LINK = `<w-link href="/about">About Us</w-link>`;
const LINK_EXTERNAL = `<w-link href="https://example.com" external>External Site</w-link>`;
const LINK_DISABLED = `<w-link href="/disabled" disabled>Disabled Link</w-link>`;

// ═══════════════════════════════════════════════════════════════════════════
// Tests
// ═══════════════════════════════════════════════════════════════════════════

test.describe("w-link", () => {
  test.beforeEach(async ({ page }) => {
    // w-link doesn't have a role - wait for internal anchor to be created
    await renderComponent(page, LINK, "w-link a", "href");
  });

  test("axe accessibility scan", async ({ page }) => {
    await checkA11y(page, { selector: "w-link" });
  });

  test("renders as anchor element", async ({ page }) => {
    const link = page.locator("w-link");
    const anchor = link.locator("a");
    await expect(anchor).toBeVisible();
  });

  test("anchor has href attribute", async ({ page }) => {
    const anchor = page.locator("w-link a");
    await expect(anchor).toHaveAttribute("href", "/about");
  });

  test("is keyboard focusable", async ({ page }) => {
    const anchor = page.locator("w-link a");
    await anchor.focus();
    await expect(anchor).toBeFocused();
  });
});

test.describe("w-link external", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, LINK_EXTERNAL, "w-link a", "href");
  });

  test("opens in new tab", async ({ page }) => {
    const anchor = page.locator("w-link a");
    await expect(anchor).toHaveAttribute("target", "_blank");
  });

  test("has noopener for security", async ({ page }) => {
    const anchor = page.locator("w-link a");
    const rel = await anchor.getAttribute("rel");
    expect(rel).toContain("noopener");
  });
});

test.describe("w-link disabled", () => {
  test.beforeEach(async ({ page }) => {
    await renderComponent(page, LINK_DISABLED, "w-link a", "aria-disabled");
  });

  test("has aria-disabled", async ({ page }) => {
    const anchor = page.locator("w-link a");
    await expect(anchor).toHaveAttribute("aria-disabled", "true");
  });
});
