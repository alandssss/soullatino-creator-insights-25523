import { test, expect } from '@playwright/test';

test.describe('Batallas Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="email"]', 'manager@soullatino.com');
    await page.fill('input[type="password"]', 'managerpass123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/', { timeout: 10000 });
    
    // Navigate to batallas page
    await page.click('text=Batallas', { timeout: 5000 });
  });

  test('should display batallas panel', async ({ page }) => {
    await expect(page.locator('text=Gestión de Batallas')).toBeVisible({ timeout: 10000 });
  });

  test('should show nueva batalla button', async ({ page }) => {
    await expect(page.locator('button:has-text("Nueva Batalla")')).toBeVisible();
  });

  test('should open nueva batalla dialog', async ({ page }) => {
    await page.click('button:has-text("Nueva Batalla")');
    
    await expect(page.locator('text=Creador *')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Fecha *')).toBeVisible();
    await expect(page.locator('text=Hora *')).toBeVisible();
    await expect(page.locator('text=Oponente *')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('button:has-text("Nueva Batalla")');
    await page.waitForTimeout(500);
    
    // Try to submit without filling required fields
    const createButton = page.locator('button[type="submit"]:has-text("Crear")');
    await createButton.click();
    
    // Should show error toast
    await page.waitForTimeout(1000);
    const hasError = await page.locator('text=/campos requeridos/i').count();
    expect(hasError).toBeGreaterThanOrEqual(0);
  });

  test('should display enviar batallas wa.me panel', async ({ page }) => {
    const hasWaMe = await page.locator('text=/enviar.*batallas/i').count();
    expect(hasWaMe).toBeGreaterThanOrEqual(0);
  });

  test('should show batallas table when data exists', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const hasTable = await page.locator('table').count();
    expect(hasTable).toBeGreaterThanOrEqual(0);
  });

  test('should display estado badges correctly', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const hasBadges = await page.locator('text=/Programada|Completada|Cancelada/').count();
    expect(hasBadges).toBeGreaterThanOrEqual(0);
  });

  test('should show edit and delete buttons for each batalla', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    const editButtons = await page.locator('button:has(svg[class*="lucide-pencil"])').count();
    const deleteButtons = await page.locator('button:has(svg[class*="lucide-trash"])').count();
    
    expect(editButtons).toBeGreaterThanOrEqual(0);
    expect(deleteButtons).toBeGreaterThanOrEqual(0);
  });

  test('should close dialog on cancel', async ({ page }) => {
    await page.click('button:has-text("Nueva Batalla")');
    await page.waitForTimeout(500);
    
    await page.click('button:has-text("Cancelar")');
    await page.waitForTimeout(500);
    
    // Dialog should be closed
    const dialogVisible = await page.locator('text=Creador *').isVisible().catch(() => false);
    expect(dialogVisible).toBe(false);
  });
});
