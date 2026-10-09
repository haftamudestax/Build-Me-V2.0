# Standards

## Package manager

pnpm only. Never use `npm install` or `yarn` in this repo — mixing package
managers produces conflicting lockfiles. Version is pinned via
`"packageManager"` in the root `package.json`; keep this in sync with what's
actually installed (`pnpm --version`).

## Where dependencies go

Install dependencies in the specific package/app that uses them
(`cd apps/web && pnpm add ...`), not at the repo root. Root-level installs
(`pnpm add -w ...`) are reserved for repo-wide tooling only (e.g. `turbo`).
See `docs/architecture.md` for the reasoning.

## Naming conventions

- Package names are scoped: `@build-me/web`, `@build-me/api`,
  `@build-me/ui`, etc. — lowercase, hyphenated (npm scope names must be
  lowercase; this is an npm/pnpm hard requirement, not a style preference).
- Component folders use PascalCase (`Navbar/`, `Footer/`), matching the
  component name inside. Keep this consistent across every app/package —
  Vercel's Linux build servers are case-sensitive even though local
  Windows/macOS filesystems typically are not, so a casing mismatch can pass
  locally and fail only once deployed.

## TypeScript

- `strict: true` in every `tsconfig.json`.
- No implicit `any` — type function parameters explicitly, especially for
  Express route handlers (`(req: Request, res: Response) => ...`).
- Shared types (API request/response shapes, etc.) live in `packages/types`,
  not duplicated in each consuming app.

## Styling

- Tailwind CSS v4 for utility classes. Note the v4 renames from earlier
  Tailwind versions: `bg-gradient-to-r` → `bg-linear-to-r`, and
  `editor.codeActionsOnSave`'s ESLint fix setting uses string values
  (`"explicit"` / `"always"`), not booleans.
- Where Material UI (`packages/ui`, `apps/admin`) and Tailwind are combined on
  the same element, use Tailwind's `!` important-prefix
  (`!bg-teal-600`/`bg-teal-600!`) to reliably override MUI's injected Emotion
  styles.
- Gradient text requires **both** `bg-clip-text` and `text-transparent` in
  addition to the gradient utility itself — a gradient background alone is
  invisible behind solid text color.

## Component testing

Every component gets a Storybook story (`ComponentName.stories.tsx`) in the
same folder as the component. Stories serve two purposes: visual
documentation (`pnpm storybook`) and automated testing (`pnpm test`, via
`@storybook/addon-vitest`, which runs stories in a real headless Chromium
browser through Playwright).

- Prefer testing **presence, roles, and accessible names** over exact
  implementation detail.
- Do not click buttons/links in `play` functions that trigger real browser
  side effects (native `alert()`, `navigator.share`, `mailto:` navigation,
  real anchor navigation without `preventDefault`) — these are unreliable in
  headless CI and have caused real test-runner crashes in this project
  ("Browser connection was closed" errors traced back to un-prevented anchor
  navigation during a `userEvent.click`).
- When a string appears more than once on a rendered page, use
  `getAllByText` instead of `getByText` — the latter throws on multiple
  matches.
- Import `Meta`/`StoryObj` from the framework-specific package
  (`@storybook/react-vite`), not the generic `@storybook/react` — the
  Storybook ESLint plugin (`storybook/no-renderer-packages`) enforces this.

## Branching

```
feature/<short-description>  →  development  →  main
```

- Branch off `development` for new work.
- PRs into `development` require `feature-validation.yml`'s checks to pass
  (lint, typecheck, test, build, security audit) — configured as required
  status checks in branch protection settings.
- `main` is production. Only updated via PR from `development`, never
  pushed to directly.

## Linting

ESLint flat config (`eslint.config.js`) per app/package, not a single shared
root config, since `apps/web` (browser globals, React rules) and
`services/api` (Node globals, no React) need different rule sets. Always
exclude build output folders explicitly:
`{ ignores: ['dist', '.vercel'] }` — omitting `.vercel` causes ESLint to
attempt parsing stale build artifacts left behind by local
`vercel build` runs, producing confusing `tsconfigRootDir` errors unrelated
to real source code.

## Commit messages

Conventional-style prefixes: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`.
Keep fixes to infrastructure/config (CI, Vercel settings, dependency
versions) in their own commits, separate from feature work, so the history
stays easy to bisect when something breaks.

## Security

- `pnpm audit --audit-level=high` runs on every feature-branch push; fails
  the build on high/critical vulnerabilities.
- Dependabot and secret scanning should be enabled at the GitHub repo level
  (Settings → Code security).
- Never commit `.env` files with real secrets. `database/.env`,
  `apps/*/.env.local`, and any Supabase service-role key must stay
  gitignored.
