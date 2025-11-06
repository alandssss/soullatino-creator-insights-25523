import { test, expect } from '@playwright/test';

test.describe('Visual Regression Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000); // Wait for content to stabilize
  });

  test('dashboard looks correct in light mode', async ({ page }) => {
    // Disable animations for consistent screenshots
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    await expect(page).toHaveScreenshot('dashboard-light.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('dashboard looks correct in dark mode', async ({ page }) => {
    // Toggle dark mode
    const themeToggle = page.locator('button[aria-label*="theme"], button[aria-label*="tema"]');
    if (await themeToggle.count() > 0) {
      await themeToggle.click();
      await page.waitForTimeout(500);
    }
    
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    await expect(page).toHaveScreenshot('dashboard-dark.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('top performers cards have correct styling', async ({ page }) => {
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    const topPerformers = page.locator('text=Top Performers del Mes').locator('..');
    await expect(topPerformers).toHaveScreenshot('top-performers.png', {
      maxDiffPixels: 50,
    });
  });

  test('creator card hover state', async ({ page }) => {
    await page.waitForTimeout(1000);
    
    const firstCreatorButton = page.locator('button:has-text("💎")').first();
    if (await firstCreatorButton.count() > 0) {
      await firstCreatorButton.hover();
      await page.waitForTimeout(300);
      
      await expect(firstCreatorButton).toHaveScreenshot('creator-card-hover.png', {
        maxDiffPixels: 30,
      });
    }
  });

  test('header has gradient styling', async ({ page }) => {
    const header = page.locator('header').first();
    
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    await expect(header).toHaveScreenshot('header-gradient.png', {
      maxDiffPixels: 20,
    });
  });

  test('logout button has correct styling', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Salir")');
    
    await expect(logoutButton).toHaveScreenshot('logout-button.png', {
      maxDiffPixels: 10,
    });
  });

  test('logout button hover state', async ({ page }) => {
    const logoutButton = page.locator('button:has-text("Salir")');
    await logoutButton.hover();
    await page.waitForTimeout(200);
    
    await expect(logoutButton).toHaveScreenshot('logout-button-hover.png', {
      maxDiffPixels: 15,
    });
  });

  test('mobile viewport looks correct', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.waitForTimeout(1000);
    
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    await expect(page).toHaveScreenshot('dashboard-mobile.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });

  test('tablet viewport looks correct', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(1000);
    
    await page.addStyleTag({
      content: '*, *::before, *::after { animation-duration: 0s !important; transition-duration: 0s !important; }'
    });
    
    await expect(page).toHaveScreenshot('dashboard-tablet.png', {
      fullPage: true,
      maxDiffPixels: 100,
    });
  });
});
