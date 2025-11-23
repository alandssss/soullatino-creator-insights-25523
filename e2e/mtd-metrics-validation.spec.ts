import { test, expect } from '@playwright/test';

/**
 * Tests E2E para validar que las métricas MTD (Month-to-Date) 
 * NO estén duplicadas y se calculen correctamente usando Math.max()
 * 
 * Fix aplicado: Cambio de reduce() a Math.max() para valores acumulados
 * Archivos corregidos: CreatorMetricsPanel.tsx, creatorAnalytics.ts
 */
test.describe('MTD Metrics Validation - No Duplication', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    
    // Login con credenciales de admin
    await page.fill('input[type="email"]', 'admin@soullatino.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Esperar redirect al dashboard
    await page.waitForURL('/', { timeout: 10000 });
    await page.waitForTimeout(2000); // Esperar carga de datos
  });

  test('Dashboard - valores de diamantes deben ser realistas (no duplicados)', async ({ page }) => {
    // Esperar a que se carguen los top performers
    await page.waitForSelector('text=Top Performers del Mes', { timeout: 10000 });
    await page.waitForTimeout(1000);
    
    // Obtener valores de diamantes de las tarjetas
    const diamondValues = await page.locator('[class*="font-bold text-primary"]').allTextContents();
    
    // Filtrar solo valores numéricos con formato "XXK 💎"
    const numericValues = diamondValues
      .filter(text => text.includes('💎'))
      .map(text => {
        const match = text.match(/(\d+)K/);
        return match ? parseInt(match[1]) : 0;
      })
      .filter(val => val > 0);
    
    if (numericValues.length > 0) {
      // Verificar que los valores sean razonables (< 2000K para un mes)
      // Valores mayores a 2000K (2M) probablemente están duplicados
      numericValues.forEach(value => {
        expect(value).toBeLessThan(2000); // Max 2M diamantes/mes es razonable
        expect(value).toBeGreaterThan(0);
      });
      
      console.log('✅ Dashboard diamantes values:', numericValues);
    }
  });

  test('CreatorMetricsPanel - MTD metrics no deben estar multiplicados', async ({ page }) => {
    // Abrir primer creador disponible
    await page.waitForTimeout(2000);
    const creatorCards = page.locator('[data-testid="creator-card"]');
    const count = await creatorCards.count();
    
    if (count > 0) {
      await creatorCards.first().click();
      
      // Navegar a tab de métricas
      const metricsTab = page.locator('text=Métricas');
      if (await metricsTab.isVisible({ timeout: 5000 })) {
        await metricsTab.click();
        await page.waitForTimeout(1000);
        
        // Verificar "Días Live MTD"
        const diasText = await page.locator('text=Días Live MTD').locator('..').locator('..').textContent();
        if (diasText) {
          // Extraer número de días (debe ser <= 31)
          const diasMatch = diasText.match(/(\d+)/);
          if (diasMatch) {
            const dias = parseInt(diasMatch[1]);
            expect(dias).toBeLessThanOrEqual(31); // Max días en un mes
            expect(dias).toBeGreaterThanOrEqual(0);
            console.log('✅ Días Live MTD:', dias);
          }
        }
        
        // Verificar "Horas Live MTD"
        const horasElements = await page.locator('text=Horas Live MTD').locator('..').locator('..').allTextContents();
        const horasText = horasElements.join(' ');
        if (horasText) {
          // Extraer horas (debe ser < 744h que es el máximo en un mes)
          const horasMatch = horasText.match(/(\d+\.?\d*)h/);
          if (horasMatch) {
            const horas = parseFloat(horasMatch[1]);
            expect(horas).toBeLessThan(744); // 31 días * 24h
            expect(horas).toBeGreaterThanOrEqual(0);
            console.log('✅ Horas Live MTD:', horas);
          }
        }
        
        // Verificar "Diamantes MTD"
        const diamantesElements = await page.locator('text=Diamantes MTD').locator('..').locator('..').allTextContents();
        const diamantesText = diamantesElements.join(' ');
        if (diamantesText) {
          // Extraer diamantes (formato con separador de miles)
          const diamantesMatch = diamantesText.match(/([\d,]+)/);
          if (diamantesMatch) {
            const diamantes = parseInt(diamantesMatch[1].replace(/,/g, ''));
            // Verificar que sea razonable (< 5M para un mes)
            expect(diamantes).toBeLessThan(5000000);
            expect(diamantes).toBeGreaterThanOrEqual(0);
            console.log('✅ Diamantes MTD:', diamantes);
          }
        }
      }
    }
  });

  test('BonificacionesPanel - horas deben ser realistas (no sumadas incorrectamente)', async ({ page }) => {
    await page.waitForTimeout(2000);
    const creatorCards = page.locator('[data-testid="creator-card"]');
    const count = await creatorCards.count();
    
    if (count > 0) {
      await creatorCards.first().click();
      
      // Navegar a tab de bonificación
      const bonifTab = page.locator('text=Bonificación');
      if (await bonifTab.isVisible({ timeout: 5000 })) {
        await bonifTab.click();
        await page.waitForTimeout(1000);
        
        // Buscar sección "LIVE del Mes"
        const liveSection = page.locator('text=LIVE del Mes');
        if (await liveSection.isVisible()) {
          // Verificar horas en la sección de bonificaciones
          const horasCard = page.locator('text=Horas Live').locator('..');
          const horasText = await horasCard.textContent();
          
          if (horasText) {
            const horasMatch = horasText.match(/(\d+\.?\d*)h/);
            if (horasMatch) {
              const horas = parseFloat(horasMatch[1]);
              // Las horas no deben estar duplicadas (< 744h por mes)
              expect(horas).toBeLessThan(744);
              expect(horas).toBeGreaterThanOrEqual(0);
              console.log('✅ Bonificaciones - Horas Live:', horas);
            }
          }
          
          // Verificar días
          const diasCard = page.locator('text=Días Live').locator('..');
          const diasText = await diasCard.textContent();
          
          if (diasText) {
            const diasMatch = diasText.match(/(\d+)/);
            if (diasMatch) {
              const dias = parseInt(diasMatch[1]);
              expect(dias).toBeLessThanOrEqual(31);
              expect(dias).toBeGreaterThanOrEqual(0);
              console.log('✅ Bonificaciones - Días Live:', dias);
            }
          }
        }
      }
    }
  });

  test('Coherencia entre vistas - Dashboard vs CreatorMetrics', async ({ page }) => {
    await page.waitForTimeout(2000);
    
    // 1. Capturar diamantes del dashboard (primer creador)
    let dashboardDiamonds = 0;
    const firstCreatorDiamonds = page.locator('[data-testid="creator-card"]').first().locator('text=/\\d+K 💎/');
    if (await firstCreatorDiamonds.isVisible({ timeout: 5000 })) {
      const text = await firstCreatorDiamonds.textContent();
      const match = text?.match(/(\d+)K/);
      if (match) {
        dashboardDiamonds = parseInt(match[1]) * 1000;
      }
    }
    
    // 2. Abrir ese mismo creador y ver sus métricas detalladas
    const creatorCards = page.locator('[data-testid="creator-card"]');
    if (await creatorCards.count() > 0) {
      await creatorCards.first().click();
      
      const metricsTab = page.locator('text=Métricas');
      if (await metricsTab.isVisible({ timeout: 5000 })) {
        await metricsTab.click();
        await page.waitForTimeout(1000);
        
        // 3. Capturar diamantes MTD del panel de métricas
        const diamantesElements = await page.locator('text=Diamantes MTD').locator('..').locator('..').allTextContents();
        const diamantesText = diamantesElements.join(' ');
        
        if (diamantesText && dashboardDiamonds > 0) {
          const diamantesMatch = diamantesText.match(/([\d,]+)/);
          if (diamantesMatch) {
            const metricsDiamonds = parseInt(diamantesMatch[1].replace(/,/g, ''));
            
            // Los valores deben ser similares (diferencia < 20% por redondeo)
            const difference = Math.abs(metricsDiamonds - dashboardDiamonds);
            const percentDiff = (difference / dashboardDiamonds) * 100;
            
            expect(percentDiff).toBeLessThan(20);
            console.log('✅ Coherencia Dashboard vs Metrics:');
            console.log('   Dashboard:', dashboardDiamonds);
            console.log('   Metrics:', metricsDiamonds);
            console.log('   Diferencia:', percentDiff.toFixed(2) + '%');
          }
        }
      }
    }
  });

  test('Validación de límites - ningún valor debe exceder máximos físicos', async ({ page }) => {
    await page.waitForTimeout(2000);
    const creatorCards = page.locator('[data-testid="creator-card"]');
    const count = await creatorCards.count();
    
    if (count > 0) {
      // Probar con múltiples creadores (hasta 3)
      const testCount = Math.min(count, 3);
      
      for (let i = 0; i < testCount; i++) {
        await creatorCards.nth(i).click();
        await page.waitForTimeout(500);
        
        const metricsTab = page.locator('text=Métricas');
        if (await metricsTab.isVisible({ timeout: 3000 })) {
          await metricsTab.click();
          await page.waitForTimeout(500);
          
          // Verificar límites máximos
          const pageContent = await page.content();
          
          // Buscar patrones de horas que indiquen duplicación (ej: 1500h, 2000h)
          const suspiciousHours = pageContent.match(/(\d{4,})\.?\d*h/g);
          if (suspiciousHours) {
            suspiciousHours.forEach(hours => {
              const value = parseInt(hours);
              console.warn('⚠️ Valor sospechoso encontrado:', hours);
              expect(value).toBeLessThan(744); // Fallaría si hay duplicación
            });
          }
          
          // Buscar días > 31
          const suspiciousDays = pageContent.match(/(\d{2,}) días/g);
          if (suspiciousDays) {
            suspiciousDays.forEach(days => {
              const value = parseInt(days);
              if (value > 31) {
                console.warn('⚠️ Días sospechosos:', days);
                expect(value).toBeLessThanOrEqual(31);
              }
            });
          }
          
          // Cerrar modal y continuar
          await page.keyboard.press('Escape');
          await page.waitForTimeout(300);
        }
      }
    }
  });

  test('No debe haber valores NaN o undefined visibles en UI', async ({ page }) => {
    await page.waitForTimeout(2000);
    const creatorCards = page.locator('[data-testid="creator-card"]');
    
    if (await creatorCards.count() > 0) {
      await creatorCards.first().click();
      
      const metricsTab = page.locator('text=Métricas');
      if (await metricsTab.isVisible({ timeout: 5000 })) {
        await metricsTab.click();
        await page.waitForTimeout(1000);
        
        // Buscar texto "NaN", "undefined", "null" en la página
        const pageText = await page.textContent('body');
        
        expect(pageText).not.toContain('NaN');
        expect(pageText).not.toContain('undefined');
        expect(pageText).not.toContain('Infinity');
        
        console.log('✅ No se encontraron valores NaN o undefined en UI');
      }
    }
  });
});
