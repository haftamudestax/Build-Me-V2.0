# Deployment

## Overview

Each deployable app/service is deployed independently. There is no single
"deploy everything" command — CI/CD orchestrates parallel, per-project
deploys on push.

## Vercel projects

| Project | Source         | Root Directory setting | Build Command              | Output Directory |
| ------- | -------------- | ---------------------- | -------------------------- | ---------------- |
| Web     | `apps/web`     | `apps/web`             | auto-detected (Vite)       | `dist`           |
| Admin   | `apps/admin`   | `apps/admin`           | auto-detected (Vite)       | `dist`           |
| API     | `services/api` | `services/api`         | _(blank — see note below)_ | _(blank)_        |

**Note on the API project**: `services/api/vercel.json` sets
`"buildCommand": ""` deliberately. Vercel's zero-config Node function builder
compiles `api/index.ts` directly; running `tsc` as a "build" step causes
Vercel to expect a static output folder (`public`/`.`) that doesn't exist for
a pure serverless-functions project, producing a
"No Output Directory" error. The `tsc` build in `package.json` is for local
dev only (`pnpm run build` before `node dist/index.js`), not for deployment.

## Branch strategy → environment mapping

```
feature/*   →  no deploy (validated by feature-validation.yml on push)
development →  staging (Vercel preview deployments)
main        →  production (Vercel production deployments, stable aliases)
```

## CI/CD pipeline

### `.github/workflows/feature-validation.yml`

Triggers on push to any `feature/**` branch. Runs lint, type check, tests
(including Playwright-based Storybook interaction tests), build, and a
dependency security audit (`pnpm audit --audit-level=high`). Required as a
status check on PRs into `development` via branch protection rules — GitHub
attaches the check result to the commit SHA, so it satisfies the requirement
even though the workflow itself only runs on `push`, not `pull_request`.

### `.github/workflows/deploy.yml`

Triggers on push to `development` or `main`.

1. **`test`** job — lint, test, build across the whole workspace (Turbo runs
   this for every package that defines the relevant script).
2. **`deploy-*-staging`** jobs (on `development`) / **`deploy-*-production`**
   jobs (on `main`) — one pair per deployable project (web, admin, api). Each:
   - Checks out the full repo (so `pnpm-lock.yaml` and `pnpm-workspace.yaml`
     are present — required for `pnpm install` to succeed; a partial/subfolder
     checkout triggers a known pnpm registry bug, `ERR_INVALID_THIS`)
   - Runs `pnpm install --frozen-lockfile` **on the GitHub runner** (not on
     Vercel's remote build servers — this sidesteps the same bug)
   - Runs `vercel pull`, `vercel build`, `vercel deploy --prebuilt` for that
     project's folder, using that project's own Vercel Project ID secret

### Required GitHub repository secrets

| Secret             | Value                                                        |
| ------------------ | ------------------------------------------------------------ |
| `VERCEL_TOKEN`     | Personal token from vercel.com/account/tokens                |
| `ORG_ID`           | Shared org/team ID across all Vercel projects                |
| `WEB_PROJECT_ID`   | From `apps/web/.vercel/project.json` after `vercel link`     |
| `ADMIN_PROJECT_ID` | From `apps/admin/.vercel/project.json` after `vercel link`   |
| `API_PROJECT_ID`   | From `services/api/.vercel/project.json` after `vercel link` |

## Local environment setup

`.npmrc` at the repo root sets `node-linker=hoisted`. This is required for
Vercel's local build/deploy tooling to correctly trace dependencies — pnpm's
default symlinked `node_modules` layout is not reliably followed by Vercel's
file tracer on all platforms, producing "File does not exist: express"-style
errors during `vercel deploy --prebuilt` otherwise.

## Database migrations

Migrations are **not** run automatically as part of the Vercel deploy — the
Supabase Vercel integration only injects environment variables, it does not
run schema changes on deploy. Run migrations manually or via a dedicated CI
step:

```powershell
cd database
pnpm db:generate
pnpm db:migrate
```

## Supabase

Connected via the Vercel Marketplace integration (Settings → Integrations →
Supabase) on the **web** project only, since that's the only frontend
currently consuming it directly. This auto-injects `SUPABASE_URL`,
`SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, etc. as environment
variables.

Because `apps/web` uses Vite (not Next.js), the auto-injected
`NEXT_PUBLIC_*`-prefixed variables are not picked up by the Vite build.
Two additional variables must be added manually in the Vercel dashboard:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`

The `SUPABASE_SERVICE_ROLE_KEY` must never be exposed to `apps/web` — it
belongs only in `services/api`'s server-side environment.

## Analytics service

`services/analytics` (Python/FastAPI) is not currently deployed to Vercel.
Hosting decision (Vercel Python functions vs. a dedicated host like Railway/
Render/Fly.io) is pending.
