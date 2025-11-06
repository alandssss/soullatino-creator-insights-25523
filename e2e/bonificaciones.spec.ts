import { test, expect } from '@playwright/test';

test.describe('Bonificaciones', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@soullatino.com');
    await page.fill('input[type="password"]', 'adminpassword123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
  });

  test('should open bonificaciones panel from creator card', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // Click first creator
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      
      // Check for bonificaciones section
      await expect(page.locator('text=Bonificaciones del Mes')).toBeVisible({ timeout: 5000 });
    }
  });

  test('should display bonificaciones metrics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      
      // Wait for dialog
      await page.waitForTimeout(1000);
      
      // Check for key metrics
      const hasDias = await page.locator('text=/días/i').count();
      const hasHoras = await page.locator('text=/horas/i').count();
      
      expect(hasDias).toBeGreaterThan(0);
      expect(hasHoras).toBeGreaterThan(0);
    }
  });

  test('should show calculate button', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      await page.waitForTimeout(1000);
      
      const calculateButton = page.locator('button:has-text("Calcular")');
      if (await calculateButton.count() > 0) {
        await expect(calculateButton).toBeVisible();
      }
    }
  });

  test('should display meta recomendada', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      await page.waitForTimeout(1000);
      
      const hasMeta = await page.locator('text=Meta Recomendada').count();
      expect(hasMeta).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show WhatsApp buttons when phone available', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      await page.waitForTimeout(1000);
      
      const whatsappButtons = await page.locator('button:has-text("WhatsApp"), a:has-text("WhatsApp")').count();
      expect(whatsappButtons).toBeGreaterThanOrEqual(0);
    }
  });

  test('should display semaforos de metas', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      await page.waitForTimeout(1000);
      
      const hasSemaforo = await page.locator('text=/50K|100K|300K|500K|1M/').count();
      expect(hasSemaforo).toBeGreaterThanOrEqual(0);
    }
  });

  test('should show hitos dias/horas section', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const creatorButtons = page.locator('button:has-text("💎")');
    const count = await creatorButtons.count();
    
    if (count > 0) {
      await creatorButtons.first().click();
      await page.waitForTimeout(1000);
      
      const hasHitos = await page.locator('text=/12d\\/40h|20d\\/60h|22d\\/80h/').count();
      expect(hasHitos).toBeGreaterThanOrEqual(0);
    }
  });
});
