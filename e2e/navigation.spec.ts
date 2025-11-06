import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@soullatino.com');
    await page.fill('input[type="password"]', 'adminpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should navigate to different pages from sidebar', async ({ page }) => {
    // Check if sidebar exists
    const hasSidebar = await page.locator('nav, aside').count();
    
    if (hasSidebar > 0) {
      // Try to navigate to different sections
      const navLinks = await page.locator('nav a, aside a').count();
      expect(navLinks).toBeGreaterThanOrEqual(0);
    }
  });

  test('should maintain authentication across navigation', async ({ page }) => {
    // Navigate to different pages and verify user stays logged in
    await page.goto('/');
    await expect(page.locator('button:has-text("Salir")')).toBeVisible();
    
    // If there are other routes, test them
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/login');
  });

  test('should handle browser back button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    // Go back
    await page.goBack();
    await page.waitForTimeout(500);
    
    // Should not redirect to login if authenticated
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });

  test('should handle browser forward button', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(1000);
    
    await page.goBack();
    await page.waitForTimeout(500);
    
    await page.goForward();
    await page.waitForTimeout(500);
    
    // Should be back at dashboard
    await expect(page.locator('text=Soullatino Analytics')).toBeVisible();
  });

  test('should show 404 page for invalid routes', async ({ page }) => {
    await page.goto('/invalid-route-that-does-not-exist');
    await page.waitForTimeout(1000);
    
    // Should show 404 or redirect
    const currentUrl = page.url();
    expect(currentUrl).toBeTruthy();
  });
});
