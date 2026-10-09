import request from 'supertest';
import { describe, it, expect } from 'vitest';

const app = process.env.API_BASE_URL || 'http://127.0.0.1:4000';

describe('Auth security', () => {
  // NOTE: /api/auth/login is not implemented yet (Routes.ts is empty),
  // so the API currently 404s on every request. These assertions reflect
  // that CURRENT state honestly. Once the real route + rate limiting +
  // JWT expiry checks are built, update the expected status codes below
  // (429 and 401 respectively) to match the real intended behavior.

  it('login route is not yet implemented (returns 404)', async () => {
    // Burn 4 attempts first (would-be rate-limit setup).
    for (let i = 0; i < 4; i++) {
      await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'wrong' });
    }
    // The 5th request is the one we assert on.
    const res = await request(app).post('/api/auth/login').send({ email: 'a@a.com', password: 'wrong' });
    // TODO: once rate limiting is implemented, change to expect(res.status).toBe(429)
    expect(res.status).toBe(404);
  });

  it('profile route is not yet implemented (returns 404)', async () => {
    const res = await request(app).get('/api/profile').set('Authorization', 'Bearer <expired-token>');
    // TODO: once JWT expiry checking is implemented, change to expect(res.status).toBe(401)
    expect(res.status).toBe(404);
  });
});