# Architecture

## Overview

This project is a pnpm + Turborepo monorepo. It hosts a public-facing personal brand website, an internal admin dashboard, a REST API, a Python analytics
service, and a set of shared packages consumed by the apps above.

```
apps/
  web/         React + Vite + TypeScript — public site
  admin/       React + Vite + TypeScript — internal dashboard
services/
  api/         Node.js + Express — REST API, deployed as Vercel serverless functions
  analytics/   Python (FastAPI) — analytics engine
packages/
  ui/          Shared Material UI + Tailwind components, documented in storybook/
  config/      Environment configuration, feature flags, constants
  types/       Shared TypeScript contracts
  utils/       Shared helper functions
  services/    API clients / external integrations, consumed by apps/web + apps/admin
database/      Drizzle ORM schema, migrations, seed data
supabase/      Supabase CLI-managed project: RLS policies, edge functions
storybook/     Shared design-system documentation for packages/ui
tests/         Cross-cutting integration and e2e tests (unit tests are colocated
               with their components inside each app/package)
```

## Data flow

Both `apps/web` and `apps/admin` are independent frontends. Neither calls the
other directly. Both talk to the same backend and, where appropriate, the same
Supabase project:

```
apps/web    ──┐
               ├──► services/api ──► database (Drizzle) ──► Supabase Postgres
apps/admin  ──┘
```

- `apps/web` uses the Supabase **anon key** only (public, read-oriented, subject
  to Row Level Security policies defined in `supabase/policies/`).
- `services/api` uses the Supabase **service role key** (or a direct Postgres
  connection via Drizzle) for privileged writes — this key never reaches the
  browser.
- `apps/admin` should authenticate before performing any write; writes go
  through `services/api`, not directly to the database, so authorization
  logic lives in one place.

## Why apps/web and apps/admin are separate

- Different audiences: public visitors vs. authenticated administrator(s).
- Different auth requirements: the public site needs none; the admin
  dashboard needs a login/session model.
- Independent deploys: a public site fix should not require redeploying (or
  re-testing) the admin dashboard, and vice versa.
- Smaller bundles: admin-only dependencies (data tables, forms, charts) never
  ship to public visitors.

## Why services/api and services/analytics are separate

`api` handles synchronous REST requests for the frontends. `analytics` is a
Python service, chosen for its data-processing ecosystem (pandas), and is
expected to run on a different schedule/trigger model (batch jobs, scheduled
runs) rather than request/response — kept out of the Node.js dependency graph
entirely.

## Why packages/\* exist

Any logic or UI shared between `apps/web` and `apps/admin` (or between either
app and `services/api`) belongs in `packages/*`, not duplicated:

- `packages/ui` — shared React components (e.g. a `Button`, form primitives)
- `packages/types` — one source of truth for shapes like API response types,
  imported by both the API (to type its responses) and the frontends (to type
  their fetch calls)
- `packages/utils` — pure helper functions with no framework dependency
- `packages/config` — environment variable access patterns, feature flags
- `packages/services` — typed API client functions (e.g. `checkApiHealth()`),
  so frontends never hand-write `fetch` calls to the API directly

## Deployment topology

Each deployable unit is its own **Vercel project**:

| Vercel project                 | Source folder  | Deploy trigger                                        |
| ------------------------------ | -------------- | ----------------------------------------------------- |
| `about-me-web` (or equivalent) | `apps/web`     | push to `development` (staging) / `main` (production) |
| `about-me-admin`               | `apps/admin`   | same                                                  |
| `about-me-api`                 | `services/api` | same                                                  |

`services/analytics`, `database`, and `supabase` are not Vercel deployments —
see `docs/deployment.md` for how each is actually run/deployed.

## Testing strategy

- **Unit / component tests**: colocated with the component they test (e.g.
  `Navbar.stories.tsx` inside `apps/web`, run via Storybook's Vitest addon in a
  real headless Chromium browser).
- **Integration tests** (`tests/integration/`): cross-service checks, e.g. that
  a running `services/api` instance responds correctly on `/health`.
- **End-to-end tests** (`tests/e2e/`): Cypress, exercising the full stack
  (frontend + API + database) as a real user would.
- **Shared component documentation/testing**: `storybook/` documents and tests
  `packages/ui` in isolation from any single app.
