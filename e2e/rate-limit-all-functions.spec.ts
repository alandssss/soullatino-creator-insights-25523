import { test, expect } from '@playwright/test';

// Configuración base de URLs
const BASE_URL = process.env.VITE_SUPABASE_URL || 'https://mpseoscrzpnequwvzokn.supabase.co';
const ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

// Funciones a testear con sus límites esperados
const FUNCTIONS_TO_TEST = [
  { name: 'generate-creator-advice', limit: 20, payload: { creator_id: 'test-uuid' } },
  { name: 'process-creator-analytics', limit: 20, payload: { creatorId: 'test-uuid' } },
  { name: 'upload-excel-recommendations', limit: 10, payload: {}, isFormData: true },
  { name: 'supervision-quicklog', limit: 60, payload: { creator_id: 'test-uuid', flags: {} } },
  { name: 'register-contact', limit: 5, payload: { creator_id: 'test-uuid', channel: 'WhatsApp' } },
];

for (const func of FUNCTIONS_TO_TEST) {
  test.describe(`Rate Limiting: ${func.name}`, () => {
    test(`should rate-limit ${func.name} after ${func.limit + 5} requests`, async ({ request }) => {
      const endpoint = `${BASE_URL}/functions/v1/${func.name}`;
      
      // Hacer (límite + 5) requests para asegurar que alcanzamos el límite
      const totalRequests = func.limit + 5;
      const requests = [];
      
      for (let i = 0; i < totalRequests; i++) {
        let requestPromise;
        
        if (func.isFormData) {
          // Para funciones que esperan FormData (como upload-excel-recommendations)
          const formData = new FormData();
          formData.append('file', new Blob(['test'], { type: 'application/vnd.ms-excel' }));
          
          requestPromise = request.post(endpoint, {
            multipart: {
              file: {
                name: 'test.xlsx',
                mimeType: 'application/vnd.ms-excel',
                buffer: Buffer.from('test')
              }
            },
            headers: ANON_KEY ? {
              'apikey': ANON_KEY,
            } : undefined,
          });
        } else {
          requestPromise = request.post(endpoint, {
            data: func.payload,
            headers: {
              'Content-Type': 'application/json',
              ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
            },
          });
        }
        
        requests.push(requestPromise);
      }
      
      // Ejecutar todos los requests en paralelo (simula ataque)
      const responses = await Promise.all(requests.map(p => p.catch(e => e)));
      
      // Contar cuántos fueron rate-limited (429)
      const rateLimitedCount = responses.filter(r => r && r.status && r.status() === 429).length;
      
      // Debe haber al menos 1 request rate-limited
      expect(rateLimitedCount).toBeGreaterThan(0);
      
      console.log(`[${func.name}] Total requests: ${totalRequests}, Rate-limited: ${rateLimitedCount}`);
      
      // Verificar que el response 429 tiene el header correcto
      const limitedResponse = responses.find(r => r && r.status && r.status() === 429);
      if (limitedResponse) {
        const headers = await limitedResponse.allHeaders();
        
        // Verificar header Retry-After (debe ser "60" segundos)
        if (headers['retry-after']) {
          expect(headers['retry-after']).toBe('60');
          console.log(`[${func.name}] Retry-After header: ${headers['retry-after']}s ✅`);
        }
        
        // Verificar mensaje de error
        const body = await limitedResponse.json();
        expect(body.error).toBe('rate_limit');
        expect(body.message).toContain('Demasiadas peticiones');
        console.log(`[${func.name}] Error message: ${body.message} ✅`);
      }
    });
    
    test(`should allow requests after rate-limit window expires for ${func.name}`, async ({ request }) => {
      const endpoint = `${BASE_URL}/functions/v1/${func.name}`;
      
      // Hacer requests hasta ser rate-limited
      let rateLimited = false;
      for (let i = 0; i < func.limit + 5; i++) {
        const response = await request.post(endpoint, {
          data: func.payload,
          headers: {
            'Content-Type': 'application/json',
            ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
          },
        });
        
        if (response.status() === 429) {
          rateLimited = true;
          break;
        }
      }
      
      expect(rateLimited).toBeTruthy();
      console.log(`[${func.name}] Rate-limited successfully, waiting 61 seconds...`);
      
      // Esperar 61 segundos (ventana de rate-limit es 60s)
      await new Promise(resolve => setTimeout(resolve, 61000));
      
      // Intentar nuevo request - debe pasar
      const responseAfterWait = await request.post(endpoint, {
        data: func.payload,
        headers: {
          'Content-Type': 'application/json',
          ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
        },
      });
      
      // Puede ser 200 (éxito) o 401/403 (sin auth), pero NO debe ser 429
      expect(responseAfterWait.status()).not.toBe(429);
      console.log(`[${func.name}] Request allowed after wait ✅ (status: ${responseAfterWait.status()})`);
    });
  });
}

// Test adicional: verificar que diferentes IPs NO comparten límite
test.describe('Rate Limiting: IP Isolation', () => {
  test('should rate-limit independently per IP', async ({ request, context }) => {
    const endpoint = `${BASE_URL}/functions/v1/register-contact`;
    const payload = { creator_id: 'test-uuid', channel: 'WhatsApp' };
    
    // Simular 2 IPs diferentes (via diferentes contextos)
    const context2 = await context.browser()?.newContext({
      extraHTTPHeaders: {
        'X-Forwarded-For': '192.168.1.100', // IP simulada 1
      }
    });
    
    const context3 = await context.browser()?.newContext({
      extraHTTPHeaders: {
        'X-Forwarded-For': '192.168.1.200', // IP simulada 2
      }
    });
    
    if (!context2 || !context3) {
      test.skip();
      return;
    }
    
    const request2 = context2.request;
    const request3 = context3.request;
    
    // IP1: Hacer 6 requests (límite es 5)
    const responses1 = await Promise.all(
      Array(6).fill(null).map(() =>
        request2.post(endpoint, {
          data: payload,
          headers: {
            'Content-Type': 'application/json',
            ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
          },
        })
      )
    );
    
    const rateLimited1 = responses1.some(r => r.status() === 429);
    expect(rateLimited1).toBeTruthy();
    
    // IP2: Debe poder hacer requests (no compartir límite con IP1)
    const response2 = await request3.post(endpoint, {
      data: payload,
      headers: {
        'Content-Type': 'application/json',
        ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
      },
    });
    
    // IP2 NO debe estar rate-limited (puede ser 401/403 por auth, pero no 429)
    expect(response2.status()).not.toBe(429);
    console.log('IP isolation working correctly ✅');
    
    await context2.close();
    await context3.close();
  });
});

// Test de performance: verificar que rate-limiting no degrada latencia
test.describe('Rate Limiting: Performance Impact', () => {
  test('should not significantly increase latency', async ({ request }) => {
    const endpoint = `${BASE_URL}/functions/v1/register-contact`;
    const payload = { creator_id: 'test-uuid', channel: 'WhatsApp' };
    
    // Medir latencia de 5 requests (bajo límite)
    const startTime = Date.now();
    await Promise.all(
      Array(5).fill(null).map(() =>
        request.post(endpoint, {
          data: payload,
          headers: {
            'Content-Type': 'application/json',
            ...(ANON_KEY ? { 'apikey': ANON_KEY } : {}),
          },
        })
      )
    );
    const endTime = Date.now();
    
    const avgLatency = (endTime - startTime) / 5;
    
    console.log(`Average latency with rate-limiting: ${avgLatency.toFixed(0)}ms`);
    
    // Latencia promedio debe ser < 500ms (incluye red + processing + rate-limit check)
    expect(avgLatency).toBeLessThan(500);
  });
});
