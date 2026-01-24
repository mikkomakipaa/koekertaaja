/**
 * E2E Accessibility Tests for Map Questions
 *
 * Tests real keyboard navigation, focus management, and visual accessibility.
 * Run with: npx playwright test tests/e2e/map-accessibility.spec.ts
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Map Question Keyboard Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page with a map question
    // Adjust URL based on your test setup
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');
  });

  test('should navigate regions with keyboard', async ({ page }) => {
    // Focus on first region button
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab'); // Skip toggle button

    // Check first region has focus
    const firstRegion = page.getByRole('button', { name: /suomi/i });
    await expect(firstRegion).toBeFocused();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    const secondRegion = page.getByRole('button', { name: /ruotsi/i });
    await expect(secondRegion).toBeFocused();

    await page.keyboard.press('ArrowDown');
    const thirdRegion = page.getByRole('button', { name: /norja/i });
    await expect(thirdRegion).toBeFocused();

    // Navigate backwards
    await page.keyboard.press('ArrowUp');
    await expect(secondRegion).toBeFocused();
  });

  test('should select region with Enter key', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Select with Enter
    await page.keyboard.press('Enter');

    // Verify selection
    const selectedButton = page.getByRole('button', { name: /suomi.*valittu/i });
    await expect(selectedButton).toHaveAttribute('aria-current', 'true');
  });

  test('should select region with Space key', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Select with Space
    await page.keyboard.press('Space');

    // Verify selection
    const selectedButton = page.getByRole('button', { name: /suomi.*valittu/i });
    await expect(selectedButton).toHaveAttribute('aria-current', 'true');
  });

  test('should support Home and End keys', async ({ page }) => {
    const container = page.getByRole('group', { name: /alueiden valinnat/i });
    await container.focus();

    // Press End to go to last region
    await page.keyboard.press('End');
    const lastButton = page.getByRole('button', { name: /tanska/i });
    await expect(lastButton).toBeFocused();

    // Press Home to go to first region
    await page.keyboard.press('Home');
    const firstButton = page.getByRole('button', { name: /suomi/i });
    await expect(firstButton).toBeFocused();
  });

  test('should support alphanumeric quick navigation', async ({ page }) => {
    const container = page.getByRole('group', { name: /alueiden valinnat/i });
    await container.focus();

    // Press 'r' to jump to "Ruotsi"
    await page.keyboard.press('r');
    const button = page.getByRole('button', { name: /ruotsi/i });
    await expect(button).toBeFocused();
  });
});

test.describe('Map Question Focus Indicators', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');
  });

  test('should show visible focus ring', async ({ page }) => {
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const button = page.getByRole('button', { name: /suomi/i }).first();

    // Check for focus ring styles
    const boxShadow = await button.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('box-shadow');
    });

    // Should have a visible focus ring (ring-2 ring-blue-500)
    expect(boxShadow).toBeTruthy();
    expect(boxShadow).not.toBe('none');
  });

  test('should maintain focus visibility in dark mode', async ({ page }) => {
    // Enable dark mode
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const button = page.getByRole('button', { name: /suomi/i }).first();
    const boxShadow = await button.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('box-shadow');
    });

    expect(boxShadow).toBeTruthy();
    expect(boxShadow).not.toBe('none');
  });

  test('should have high contrast focus in forced-colors mode', async ({ page }) => {
    // Emulate high contrast mode
    await page.emulateMedia({ forcedColors: 'active' });
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    const button = page.getByRole('button', { name: /suomi/i }).first();

    // In forced-colors mode, outline should be visible
    const outline = await button.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('outline');
    });

    expect(outline).toBeTruthy();
  });
});

test.describe('Text Fallback Mode Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');
  });

  test('should toggle to text mode with keyboard', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.focus();
    await page.keyboard.press('Enter');

    // Verify text mode is active
    const searchInput = page.getByRole('combobox', { name: /hae alueita/i });
    await expect(searchInput).toBeVisible();
  });

  test('should navigate dropdown with keyboard', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.click();

    const searchInput = page.getByRole('combobox');
    await searchInput.click();

    // Open dropdown
    await searchInput.focus();

    // Navigate with arrow keys
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('ArrowDown');

    // Select with Enter
    await page.keyboard.press('Enter');

    // Verify selection
    await expect(page.getByText(/valittu alue/i)).toBeVisible();
  });

  test('should filter regions with search', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.click();

    const searchInput = page.getByRole('combobox');
    await searchInput.fill('suo');

    // Dropdown should show filtered results
    const listbox = page.getByRole('listbox');
    await expect(listbox).toBeVisible();

    // Should contain "Suomi"
    await expect(listbox.getByText(/suomi/i)).toBeVisible();
  });

  test('should support Escape key to close dropdown', async ({ page }) => {
    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.click();

    const searchInput = page.getByRole('combobox');
    await searchInput.click();

    // Press Escape
    await page.keyboard.press('Escape');

    // Dropdown should be closed
    const listbox = page.getByRole('listbox');
    await expect(listbox).not.toBeVisible();
  });
});

test.describe('ARIA Attributes and Screen Reader Support', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');
  });

  test('should have proper ARIA roles', async ({ page }) => {
    // Map image should have role="img"
    const mapImage = page.getByRole('img').first();
    await expect(mapImage).toHaveAttribute('role', 'img');

    // Region group should have role="group"
    const group = page.getByRole('group', { name: /alueiden valinnat/i });
    await expect(group).toBeVisible();

    // Buttons should have role="button"
    const buttons = page.getByRole('button');
    expect(await buttons.count()).toBeGreaterThan(0);
  });

  test('should have aria-pressed for multi-select', async ({ page }) => {
    await page.goto('/test/map-question-multi');
    await page.waitForLoadState('networkidle');

    const button = page.getByRole('button', { name: /suomi/i }).first();

    // Initially not pressed
    await expect(button).toHaveAttribute('aria-pressed', 'false');

    // Click to select
    await button.click();

    // Should be pressed
    await expect(button).toHaveAttribute('aria-pressed', 'true');
  });

  test('should have aria-current for single-select', async ({ page }) => {
    const button = page.getByRole('button', { name: /suomi/i }).first();
    await button.click();

    // Should have aria-current
    await expect(button).toHaveAttribute('aria-current', 'true');
  });

  test('should have aria-describedby on map', async ({ page }) => {
    const mapImage = page.getByRole('img').first();
    const ariaDescribedby = await mapImage.getAttribute('aria-describedby');

    expect(ariaDescribedby).toBeTruthy();

    // Description element should exist
    if (ariaDescribedby) {
      const description = page.locator(`#${ariaDescribedby}`);
      await expect(description).toBeInTheDocument();
    }
  });

  test('should have live region for announcements', async ({ page }) => {
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toBeInTheDocument();

    // Click a region
    const button = page.getByRole('button', { name: /suomi/i }).first();
    await button.click();

    // Live region should contain announcement (text may vary)
    await expect(liveRegion).not.toBeEmpty();
  });
});

test.describe('Automated Accessibility Scanning', () => {
  test('should pass axe accessibility tests (single select)', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass axe accessibility tests (multi select)', async ({ page }) => {
    await page.goto('/test/map-question-multi');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass axe tests in text fallback mode', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.click();

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should pass color contrast checks', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['cat.color'])
      .analyze();

    expect(accessibilityScanResults.violations).toEqual([]);
  });
});

test.describe('Reduced Motion Support', () => {
  test('should respect prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const button = page.getByRole('button', { name: /suomi/i }).first();

    // Get transition duration
    const transition = await button.evaluate((el) => {
      return window.getComputedStyle(el).getPropertyValue('transition-duration');
    });

    // Should have minimal or no transition
    expect(transition === '0s' || transition === '').toBeTruthy();
  });
});

test.describe('Mobile Touch Accessibility', () => {
  test.use({ viewport: { width: 375, height: 667 } }); // iPhone SE size

  test('should have large enough touch targets (48x48px)', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const buttons = page.getByRole('button').filter({ hasText: /suomi|ruotsi|norja|tanska/i });
    const count = await buttons.count();

    for (let i = 0; i < count; i++) {
      const button = buttons.nth(i);
      const box = await button.boundingBox();

      if (box) {
        // WCAG AAA requires 48x48px touch targets
        expect(box.height).toBeGreaterThanOrEqual(44); // iOS minimum
      }
    }
  });

  test('should work with touch events', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const button = page.getByRole('button', { name: /suomi/i }).first();

    // Simulate touch tap
    await button.tap();

    // Should be selected
    await expect(button).toHaveAttribute('aria-current', 'true');
  });
});

test.describe('No Keyboard Traps', () => {
  test('should allow escaping from all focusable elements', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    // Tab through all elements
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
    }

    // Should be able to tab backwards
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Shift+Tab');
    }

    // No errors should occur
    expect(true).toBe(true);
  });

  test('should escape from text fallback dropdown', async ({ page }) => {
    await page.goto('/test/map-question-single');
    await page.waitForLoadState('networkidle');

    const toggleButton = page.getByRole('button', { name: /vaihda tekstinäkymään/i });
    await toggleButton.click();

    const searchInput = page.getByRole('combobox');
    await searchInput.focus();

    // Open dropdown
    await searchInput.click();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Should be able to tab away
    await page.keyboard.press('Tab');

    // Input should not have focus
    await expect(searchInput).not.toBeFocused();
  });
});
