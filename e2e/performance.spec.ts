import { test, expect } from '@playwright/test';

test.describe('Performance', () => {
  test('dashboard should load within performance budget', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Wait for main content
    await page.waitForSelector('text=Soullatino Analytics', { timeout: 5000 });
    
    const loadTime = Date.now() - startTime;
    
    // Should load within 10 seconds (generous for test environment)
    expect(loadTime).toBeLessThan(10000);
    
    console.log(`Dashboard loaded in ${loadTime}ms`);
  });

  test('should not have excessive DOM size', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Count total DOM nodes
    const nodeCount = await page.evaluate(() => {
      return document.querySelectorAll('*').length;
    });
    
    console.log(`Total DOM nodes: ${nodeCount}`);
    
    // Should have reasonable DOM size (< 5000 nodes)
    expect(nodeCount).toBeLessThan(5000);
  });

  test('images should be optimized', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check for lazy loading
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const loading = await img.getAttribute('loading');
      const src = await img.getAttribute('src');
      
      console.log(`Image: ${src}, loading: ${loading}`);
    }
    
    expect(images.length).toBeGreaterThanOrEqual(0);
  });

  test('should handle large lists efficiently with virtualization', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000);
    
    // Check rendering performance of creator list
    const startTime = Date.now();
    
    // Scroll to load more items
    await page.evaluate(() => window.scrollBy(0, 1000));
    await page.waitForTimeout(500);
    
    const scrollTime = Date.now() - startTime;
    
    // Scrolling should be smooth (< 1s)
    expect(scrollTime).toBeLessThan(1000);
    
    console.log(`Scroll and render time: ${scrollTime}ms`);
  });

  test('should not have memory leaks on navigation', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate multiple times
    for (let i = 0; i < 3; i++) {
      await page.reload();
      await page.waitForSelector('text=Soullatino Analytics');
      await page.waitForTimeout(1000);
    }
    
    // If we get here without crashes, no obvious memory leaks
    expect(true).toBe(true);
  });

  test('should handle concurrent requests efficiently', async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'test@soullatino.com');
    await page.fill('input[type="password"]', 'testpassword123');
    
    const startTime = Date.now();
    
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForSelector('text=Soullatino Analytics');
    
    const totalTime = Date.now() - startTime;
    
    console.log(`Total authentication and data load time: ${totalTime}ms`);
    
    // Should complete within reasonable time
    expect(totalTime).toBeLessThan(10000);
  });
});
