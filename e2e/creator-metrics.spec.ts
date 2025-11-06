import { test, expect } from '@playwright/test';

test.describe('Creator Metrics Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    
    // Login con credenciales de prueba
    await page.fill('[name="email"]', 'admin@soullatino.com');
    await page.fill('[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/');
    
    // Esperar a que carguen los datos
    await page.waitForTimeout(2000);
    
    // Abrir ficha del primer creador
    const firstCreatorCard = page.locator('[data-testid="creator-card"]').first();
    if (await firstCreatorCard.isVisible()) {
      await firstCreatorCard.click();
    }
  });
  
  test('debe mostrar KPIs con deltas vs mes anterior', async ({ page }) => {
    // Navegar al tab de métricas si existe
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
    }
    
    // Verificar que existen los KPIs
    await expect(page.locator('text=Días Live MTD')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Horas Live MTD')).toBeVisible();
    await expect(page.locator('text=Diamantes MTD')).toBeVisible();
    
    // Verificar que hay al menos un valor numérico visible
    const kpiValues = page.locator('[class*="neo-kpi"]');
    await expect(kpiValues.first()).toBeVisible();
  });
  
  test('debe mostrar hitos con barras de progreso', async ({ page }) => {
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
    }
    
    await expect(page.locator('text=Próximos Hitos')).toBeVisible({ timeout: 10000 });
    
    // Verificar que existen las barras de progreso
    const progressBars = page.locator('.h-2.bg-neo-pressed');
    const count = await progressBars.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });
  
  test('debe mostrar predicción de fin de mes', async ({ page }) => {
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
    }
    
    await expect(page.locator('text=Proyección Fin de Mes')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/Método:/i')).toBeVisible();
    await expect(page.locator('text=/Confianza:/i')).toBeVisible();
  });
  
  test('debe generar mensaje diario y abrir modal de WhatsApp', async ({ page }) => {
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
    }
    
    // Buscar botón de generar mensaje
    const generateButton = page.locator('text=Generar Mensaje Diario');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      
      // Verificar que se abre el modal
      await expect(page.locator('text=Vista Previa de WhatsApp')).toBeVisible({ timeout: 10000 });
      
      // Verificar que el mensaje tiene contenido
      const messagePreview = page.locator('.whitespace-pre-wrap.font-mono');
      await expect(messagePreview).not.toBeEmpty();
      
      // Verificar input de teléfono
      await expect(page.locator('placeholder="+52 1234567890"')).toBeVisible();
    }
  });
  
  test('debe validar formato E.164 del teléfono', async ({ page }) => {
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
    }
    
    const generateButton = page.locator('text=Generar Mensaje Diario');
    if (await generateButton.isVisible()) {
      await generateButton.click();
      await page.waitForSelector('text=Vista Previa de WhatsApp');
      
      // Probar teléfono inválido
      const phoneInput = page.locator('placeholder="+52 1234567890"');
      await phoneInput.fill('123');
      await page.click('text=Abrir WhatsApp');
      
      // Debe mostrar error
      await expect(page.locator('text=/Número inválido/i')).toBeVisible({ timeout: 5000 });
      
      // Probar teléfono válido
      await phoneInput.fill('+521234567890');
      const errorMessage = page.locator('text=/Número inválido/i');
      const errorVisible = await errorMessage.isVisible().catch(() => false);
      expect(errorVisible).toBe(false);
    }
  });
  
  test('debe cargar métricas sin errores', async ({ page }) => {
    const metricsTab = page.locator('text=Métricas');
    if (await metricsTab.isVisible()) {
      await metricsTab.click();
      
      // No debe haber mensajes de error
      const errorMessage = page.locator('text=/Error al cargar métricas/i');
      const hasError = await errorMessage.isVisible().catch(() => false);
      expect(hasError).toBe(false);
      
      // Debe mostrar contenido o mensaje de carga
      const loadingOrContent = page.locator('text=/Cargando métricas|Días Live MTD/i');
      await expect(loadingOrContent.first()).toBeVisible({ timeout: 10000 });
    }
  });
});
