# API Contracts

Base URL:

- Local development: `http://localhost:4000`
- Production: the `about-me-api` Vercel deployment URL (see `docs/deployment.md`)

All responses are JSON. All endpoints are served from `services/api`, deployed
as Vercel serverless functions via the `api/index.ts` entry point (see
`docs/architecture.md`).

---

## `GET /health`

Health check. Used by CI, uptime monitoring, and `tests/integration/`.

**Request**: none

**Response** `200 OK`

```json
{ "status": "ok" }
```

**Errors**: none expected. A non-200 response indicates the function itself
failed to start or crashed — check Vercel function logs.

---

## Planned endpoints (not yet implemented)

The following are placeholders reflecting the `database/drizzle/schema.ts`
`contactMessages` table already scaffolded. Update this section as each is
actually built — do not treat this as implemented behavior yet.

### `POST /contact`

Accepts a contact-form submission from `apps/web` and writes it to the
`contact_messages` table via Drizzle.

**Request**

```json
{
  "name": "string, required",
  "email": "string, required, valid email",
  "message": "string, required, 1–2000 chars"
}
```

**Response** `201 Created`

```json
{ "id": 1, "createdAt": "2026-07-22T00:00:00.000Z" }
```

**Response** `400 Bad Request` (validation failure)

```json
{ "error": "message is required" }
```

### `GET /contact` (admin-only, not yet implemented)

Lists submitted contact messages for `apps/admin`. Requires authentication —
auth mechanism to be decided (Supabase Auth is the natural fit given the rest
of the stack, but not yet wired up).

**Response** `200 OK`

```json
[
  {
    "id": 1,
    "name": "Jane Doe",
    "email": "jane@example.com",
    "message": "Hello!",
    "createdAt": "2026-07-22T00:00:00.000Z"
  }
]
```

**Response** `401 Unauthorized` if the caller is not authenticated.

---

## Conventions

- All timestamps are ISO 8601 UTC strings.
- All error responses use the shape `{ "error": "human-readable message" }`.
- Validation errors return `400`; authentication failures return `401`;
  authorization failures (authenticated but not permitted) return `403`;
  not-found resources return `404`.
- Endpoint shapes should be mirrored in `packages/types` so both
  `services/api` and any consuming frontend share one source of truth for
  request/response types — see `packages/types/src/index.ts`.
