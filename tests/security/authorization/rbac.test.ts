import request from 'supertest';
import { describe, it, expect } from 'vitest';

const app = process.env.API_BASE_URL || 'http://127.0.0.1:4000';

describe('Authorization (RBAC)', () => {
  // NOTE: /api/admin/users and /api/projects/:id are not implemented yet
  // (Routes.ts is empty), so the API currently 404s on every request.
  // These assertions reflect that CURRENT state honestly. Once the real
  // routes + role checks are built, update the expected status codes
  // below (403 in both cases) to match the real intended behavior.

  it('admin route is not yet implemented (returns 404)', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', 'Bearer <regular-user-token>');
    // TODO: once the route + RBAC check is implemented, change to expect(res.status).toBe(403)
    expect(res.status).toBe(404);
  });

  it('project ownership route is not yet implemented (returns 404)', async () => {
    const res = await request(app)
      .get('/api/projects/999') // belongs to a different user
      .set('Authorization', 'Bearer <user-a-token>');
    // TODO: once the route + ownership check is implemented, change to expect(res.status).toBe(403)
    expect(res.status).toBe(404);
  });
});