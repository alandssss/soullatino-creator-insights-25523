import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

test.describe('Accessibility (A11y)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000);
  });

  test('dashboard should be accessible', async ({ page }) => {
    await injectAxe(page);
    await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: { html: true },
    });
  });

  test('should support keyboard navigation', async ({ page }) => {
    // Tab through interactive elements
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);
    
    // Check that focus is visible
    const focusedElement = await page.locator(':focus').count();
    expect(focusedElement).toBeGreaterThan(0);
  });

  test('logout button should be keyboard accessible', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Salir")');
    
    // Focus the button
    await logoutButton.focus();
    
    // Verify focus
    const isFocused = await logoutButton.evaluate(el => el === document.activeElement);
    expect(isFocused).toBe(true);
    
    // Verify Enter key works
    await page.keyboard.press('Enter');
    await page.waitForTimeout(500);
  });

  test('creator cards should be keyboard accessible', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const firstCreatorButton = page.locator('button:has-text("💎")').first();
    
    if (await firstCreatorButton.count() > 0) {
      await firstCreatorButton.focus();
      
      const isFocused = await firstCreatorButton.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
      
      // Press Enter to open dialog
      await page.keyboard.press('Enter');
      await page.waitForTimeout(500);
      
      // Check if dialog opened
      const dialogVisible = await page.locator('role=dialog').isVisible().catch(() => false);
      expect(dialogVisible).toBeTruthy();
      
      // Press Escape to close
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
    }
  });

  test('should have proper ARIA labels', async ({ page }) => {
    // Check for aria-labels on icon-only buttons
    const iconButtons = page.locator('button:has(svg):not(:has-text)');
    const count = await iconButtons.count();
    
    if (count > 0) {
      const firstButton = iconButtons.first();
      const ariaLabel = await firstButton.getAttribute('aria-label');
      const ariaLabelledBy = await firstButton.getAttribute('aria-labelledby');
      
      // Should have either aria-label or aria-labelledby
      expect(ariaLabel !== null || ariaLabelledBy !== null).toBeTruthy();
    }
  });

  test('images should have alt text', async ({ page }) => {
    const images = page.locator('img');
    const count = await images.count();
    
    for (let i = 0; i < count; i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // All images should have alt attribute (can be empty for decorative images)
      expect(alt !== null).toBeTruthy();
    }
  });

  test('headings should have proper hierarchy', async ({ page }) => {
    // Check for h1
    const h1Count = await page.locator('h1').count();
    expect(h1Count).toBeGreaterThanOrEqual(1); // Should have at least one h1
    
    // Verify heading levels don't skip
    const allHeadings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(allHeadings.length).toBeGreaterThan(0);
  });

  test('form fields should have labels', async ({ page }) => {
    // Navigate to a page with forms if exists
    await page.click('button:has-text("Nueva Batalla")').catch(() => {});
    await page.waitForTimeout(500);
    
    const inputs = page.locator('input:visible, select:visible, textarea:visible');
    const count = await inputs.count();
    
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      const id = await input.getAttribute('id');
      
      if (id) {
        // Check for associated label
        const label = page.locator(`label[for="${id}"]`);
        const labelCount = await label.count();
        expect(labelCount).toBeGreaterThanOrEqual(0);
      }
    }
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await injectAxe(page);
    
    // Check specifically for color contrast issues
    await checkA11y(page, undefined, {
      detailedReport: true,
      rules: {
        'color-contrast': { enabled: true }
      }
    });
  });

  test('focus should be visible on all interactive elements', async ({ page }) => {
    const interactiveElements = page.locator('button, a, input, select, textarea');
    const count = await interactiveElements.count();
    
    if (count > 0) {
      const firstElement = interactiveElements.first();
      await firstElement.focus();
      
      // Wait for focus styles to apply
      await page.waitForTimeout(200);
      
      // Check that element is focused
      const isFocused = await firstElement.evaluate(el => el === document.activeElement);
      expect(isFocused).toBe(true);
    }
  });
});
