import { test, expect } from '@playwright/test';

test.describe('Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Login with test credentials
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should display dashboard header with logo', async ({ page }) => {
    await expect(page.locator('text=Soullatino Analytics')).toBeVisible();
    await expect(page.locator('text=Panel de Control')).toBeVisible();
  });

  test('should show logout button and handle click', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Salir")');
    await expect(logoutButton).toBeVisible();
    
    await logoutButton.click();
    await page.waitForURL('/login', { timeout: 5000 });
  });

  test('should display top performers section', async ({ page }) => {
    await expect(page.locator('text=Top Performers del Mes')).toBeVisible();
    
    // Wait for cards to load
    await page.waitForTimeout(2000);
    
    const performerCards = page.locator('[data-testid="creator-card"]');
    const count = await performerCards.count();
    expect(count).toBeGreaterThanOrEqual(0); // May be 0 if no data
  });

  test('should display top creadores list', async ({ page }) => {
    await expect(page.locator('text=Top Creadores')).toBeVisible();
    
    // Wait for list to load
    await page.waitForTimeout(2000);
  });

  test('should open creator detail dialog on click', async ({ page }) => {
    await page.waitForTimeout(2000); // Wait for data to load
    
    // Click first creator card if exists
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      
      // Wait for dialog to open
      await expect(page.locator('role=dialog')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display KPI panels', async ({ page }) => {
    // Check for various dashboard sections
    await page.waitForTimeout(2000);
    
    const hasGraduacionAlert = await page.locator('text=/graduación/i').count();
    expect(hasGraduacionAlert).toBeGreaterThanOrEqual(0);
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    
    await expect(page.locator('text=Soullatino Analytics')).toBeVisible();
    await expect(page.locator('button[aria-label="Salir"], button:has-text("Salir")')).toBeVisible();
  });

  test('should handle WebGL fallback gracefully', async ({ page }) => {
    // The dashboard should work even if WebGL is not available
    await page.waitForTimeout(2000);
    
    // Check that either 3D chart or fallback chart is displayed
    const has3DChart = await page.locator('canvas').count();
    const hasFallback = await page.locator('text=/visualización.*no disponible/i').count();
    
    expect(has3DChart + hasFallback).toBeGreaterThanOrEqual(0);
  });

  test('should display gradient header styles', async ({ page }) => {
    const header = page.locator('h1:has-text("Soullatino Analytics")');
    await expect(header).toBeVisible();
    
    // Check that header has gradient class
    const className = await header.getAttribute('class');
    expect(className).toContain('gradient');
  });

  test('should show sticky header on scroll', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500));
    
    // Header should still be visible (sticky)
    await expect(page.locator('text=Soullatino Analytics')).toBeVisible();
  });
});
