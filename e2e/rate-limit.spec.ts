import { test, expect } from '@playwright/test';

test.describe('Rate Limiting', () => {
  test('should return 429 after exceeding rate limit', async ({ request }) => {
    const endpoint = '/functions/v1/calculate-bonificaciones-unified';
    const payload = { mode: 'batch' };
    
    // Make 101 requests (limit is 100/min)
    const requests = [];
    for (let i = 0; i < 101; i++) {
      requests.push(
        request.post(endpoint, {
          data: payload,
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    // At least one should be rate limited
    const rateLimited = responses.some(r => r.status() === 429);
    expect(rateLimited).toBeTruthy();
    
    // Check for Retry-After header
    const limitedResponse = responses.find(r => r.status() === 429);
    if (limitedResponse) {
      const retryAfter = limitedResponse.headers()['retry-after'];
      expect(retryAfter).toBeDefined();
    }
  });
});
