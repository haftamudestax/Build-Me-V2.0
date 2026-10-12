# Build Me Project — Technology Enablement <a name="readme-top"></a>

<div align="center">
<img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" alt="React" />
<img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
<img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL" />
<img src="https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase" />
<img src="https://img.shields.io/badge/Drizzle-C5F74F?style=for-the-badge&logoColor=black" alt="Drizzle" />
<img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" alt="TailwindCSS" />
<img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" alt="Python" />
<img src="https://img.shields.io/badge/Turborepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white" alt="Turborepo" />
<img src="https://img.shields.io/badge/Monorepo-pnpm_workspaces-F69220?style=for-the-badge&logo=pnpm&logoColor=white" alt="Monorepo" />
<img src="https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />
<img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="GitHub Actions" />

<h3><b>Technology Enablement: A Toolbox for Reliable Software Delivery</b></h3>
<p>Repeatable systems, assets, templates, guides, and standards for the Build Me Project</p>

<p>
<a href="https://haftamu-desta.vercel.app/" target="_blank">
  <img src="https://img.shields.io/badge/_Live_Demo-View_App-FF5722?style=for-the-badge&logo=vercel&logoColor=white" alt="Live Demo">
</a>
<a href="https://github.com/haftamudestax/build_me_version2.0" target="_blank">
<img src="https://img.shields.io/badge/_GitHub-View_Code-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repository">
</a>
</p>
</div>

<!-- TABLE OF CONTENTS -->
<details>
  <summary>
    <h1>📗 Table of Contents</h1>
  </summary>

- [📖 About](#about)
- [🧩 1. Systems](#systems)
- [📦 2. Assets](#assets)
- [📄 3. Templates](#templates)
  - [ADR Template](#adr-template)
- [📘 4. Guides](#guides)
- [🧰 5. Toolkits](#toolkits)
- [📐 6. Standards and Practices](#standards)
- [📊 7. Reporting](#reporting)
- [🤖 8. Automation](#automation)
- [🗂 9. Backlog Management](#backlog)
- [🎓 10. Education](#education)
- [🆘 11. Support](#support)
- [🔎 12. Research](#research)
- [⚙️ 13. Operations Management](#operations)
- [✅ Status](#status)
</details>

<!-- ABOUT -->

## 📖 About <a name="about"></a>

This document is a **toolbox, not a plan** — a set of ready-to-use resources that make it easy to do good technical work on the Build Me Project.

It defines the **Technology Ownership Systems**: the repeatable patterns, engineering processes, architectural standards, and operational feedback loops that enable reliable software delivery. Systems describe _how engineering capability is structured_, distinct from the underlying tools or platforms (GitHub, Vercel, Supabase, etc.) used to execute them.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SYSTEMS -->

## 🧩 1. Systems <a name="systems"></a>

### Technology Ownership Foundations

| System Foundation        | Purpose                                                  | Operational Mechanism                                                                 | Key Deliverable / Output                                       |
| ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **Engineering System**   | Standardize feature delivery and API stability           | Contract-first development (`openapi.yaml`), monorepo package boundary enforcement    | Feature implementation pipeline (Schema → Contract → API → UI) |
| **Design System**        | Enforce visual and UI component consistency              | Shared UI component package with Storybook integration                                | Component library (`packages/ui`)                              |
| **Operational System**   | Ensure deployment safety and runtime visibility          | Automated CI/CD pipelines, p95 performance budgets, error monitoring                  | Zero-downtime release pipeline & Vercel Preview environments   |
| **Security System**      | Enforce zero-trust data access and secret safety         | Local pre-commit secret scans, mandatory RLS policies, automated vulnerability audits | `gitleaks` pre-commit hooks & pgTAP policy tests               |
| **Knowledge System**     | Capture architectural decisions and standard conventions | Structured Markdown records co-located in the repo                                    | ADRs (`docs/decisions/`) & `docs/standards.md`                 |
| **Learning System**      | Facilitate onboarding and continuous tech improvement    | Structured developer guides, troubleshooting, tech radar tracking                     | Developer guides (`docs/feature-implementation-guide.md`)      |
| **AI Workspaces System** | Accelerate code generation, testing, and debugging       | Pre-tested prompt patterns, strict human-in-the-loop review                           | Standardized prompt library (`docs/prompts/`)                  |
| **Documentation System** | Maintain a single source of truth for all workflows      | Automated OpenAPI documentation, centralized guides                                   | Self-documenting API spec & deployment checklists              |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ASSETS -->

## 📦 2. Assets <a name="assets"></a>

Reusable, copy-as-a-starting-point examples:

| Asset                                               | Location                                                                                        |
| --------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Component pattern (Component + Story + Test + Docs) | `packages/ui/src/components/Button/`                                                            |
| API route pattern (validate → insert → return)      | `services/api/src/app.ts` (`/api/leads` handler)                                                |
| Database table pattern                              | `database/drizzle/schema.ts`                                                                    |
| RLS policy pattern (deny-all vs public-read)        | `supabase/policies/*.sql`                                                                       |
| Test example (unit)                                 | `tests/unit/hero/HeroIntro.test.tsx`                                                            |
| Test example (contract)                             | `docs/postman/collections/leads-api.postman_collection.json`                                    |
| CI workflow pattern                                 | `.github/workflows/feature-validation.yml`                                                      |
| Deployment job pattern                              | `.github/workflows/deploy.yml`                                                                  |
| AI prompts that worked well                         | _Informal_ — currently recorded only in conversation history; worth extracting into a real file |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- TEMPLATES -->

## 📄 3. Templates <a name="templates"></a>

| Template                     | Status                                                                          |
| ---------------------------- | ------------------------------------------------------------------------------- |
| Technical requirements       | `docs/api-contracts.md`'s format (route, request, response, errors)             |
| Technical tasks              | Not yet created — recommend a lightweight issue template                        |
| API contracts                | `services/api/openapi.yaml` — the live template to copy from                    |
| Architecture decisions (ADR) | Not yet created — see below                                                     |
| Pull Requests                | Not yet created — recommend a template requiring: what changed, why, how tested |
| Bug reports                  | Not yet created                                                                 |
| Test plans                   | Implicit in `docs/feature-implementation-guide.md` Parts 1–3                    |
| Deployment checklists        | `docs/deployment.md`                                                            |
| Incident reports             | Not yet created — see [Operations Management](#operations)                      |
| Improvement proposals        | Not yet created                                                                 |

### ADR Template <a name="adr-template"></a>

To be created at `docs/decisions/0001-example.md` for each future decision:

```markdown
# ADR-000X: [Decision Title]

Date:
Status: Proposed / Accepted / Superseded

## Context

What problem prompted this decision?

## Decision

What was decided?

## Consequences

What becomes easier or harder as a result?
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GUIDES -->

## 📘 4. Guides <a name="guides"></a>

| Guide                   | Command(s)                                                                                          |
| ----------------------- | --------------------------------------------------------------------------------------------------- |
| Clone the repository    | `git clone github.com/haftamudestax/build_me_version2.0`                                            |
| Create a feature branch | `git checkout development && git pull && git checkout -b feature/your-feature-name`                 |
| Run the project         | `pnpm install` then `pnpm turbo run dev` (or per-app: `pnpm --filter @about-me/web dev`)            |
| Run tests               | `pnpm turbo run test`, `test:integration`, `test:e2e`, `test:contract`, `test:performance`          |
| Create a Pull Request   | Push branch → open PR into `development` on GitHub → wait for required checks                       |
| Deploy                  | Automatic on merge to `development` (staging) / `main` (production) via `deploy.yml`                |
| Debug                   | Check GitHub Actions logs for CI failures; `vercel logs <url>` for deployed runtime errors          |
| Add a database change   | Full walkthrough in `docs/feature-implementation-guide.md`, Part 1                                  |
| Add an API endpoint     | `docs/feature-implementation-guide.md`, Part 3 (contract-first: OpenAPI → Postman → implementation) |
| Add a component         | Follow `packages/ui/src/components/Button/` as the template: Component + Story + autodocs           |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- TOOLKITS -->

## 🧰 5. Toolkits <a name="toolkits"></a>

**Build Toolkit**

- [ ] Requirement matches an existing pattern (or a new ADR is written if not)
- [ ] `openapi.yaml` updated first, if API related
- [ ] Code follows `docs/standards.md`
- [ ] Feature flag added if shipping incomplete work

**Testing Toolkit**

- [ ] Unit test written for new logic/components
- [ ] API test written (contract collection + assertions)
- [ ] E2E test updated if a user-facing flow changed
- [ ] Performance: Lighthouse thresholds still met
- [ ] Security: RLS policy written for any new table

**Deployment Toolkit**

- [ ] Pre-deployment: all CI checks green, `docs/*.md` updated if architecture changed
- [ ] Deployment: merge triggers automatic deploy — no manual steps
- [ ] Rollback: Vercel dashboard → Deployments → previous deployment → Instant Rollback

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- STANDARDS -->

## 📐 6. Standards and Practices <a name="standards"></a>

Standards are documented in full at `docs/standards.md`, which serves as the single source of truth. This section intentionally avoids duplicating it.

- **Standard**: the agreed rule, convention, or requirement.
- **Practice**: the repeatable way of applying that standard during development, testing, deployment, and maintenance.

Covered areas include: package manager rules, dependency placement, naming conventions, TypeScript strictness, styling conventions, component testing patterns, branching, linting, commit messages, and security.

<details>
<summary><b>Technology Stack Standards and Practices</b></summary>

| Technology / Area            | Standards and Practices                                                                                 |
| ---------------------------- | ------------------------------------------------------------------------------------------------------- |
| Monorepo and pnpm            | Workspace structure, package boundaries, dependency placement, lockfile consistency, workspace commands |
| React                        | Component composition, state management, accessibility, reusable patterns, separation of concerns       |
| TypeScript                   | Strict typing, shared contracts, type safety, avoiding unnecessary `any`                                |
| Vite                         | App configuration, environment variables, build commands, dev server practices                          |
| Node.js and Express          | API structure, request validation, error handling, middleware, secure endpoints                         |
| Python analytics             | Code organization, environment management, data validation, testing, reproducible execution             |
| Material UI and Tailwind CSS | Consistent design tokens, responsive styling, component reuse                                           |
| Storybook                    | Documenting components, demonstrating variants, validating UI states                                    |
| Framer Motion                | Accessible animations, reusable motion patterns, performance-conscious transitions                      |
| Supabase and PostgreSQL      | Secure database access, RLS policies, schema integrity, environment separation                          |
| Drizzle ORM                  | Schema-as-code, reviewed migrations, type-safe queries, controlled database changes                     |
| OpenAPI and Postman          | Contract-first API development, request/response consistency                                            |
| Vitest                       | Isolated unit tests, meaningful assertions, reliable test setup                                         |
| Cypress                      | Repeatable end-to-end tests, stable selectors, realistic workflows                                      |
| Newman                       | Automated API contract collection execution and assertion validation                                    |
| Lighthouse CI                | Performance and accessibility measurement against defined thresholds                                    |
| GitHub Actions               | Reusable workflows, explicit permissions, dependency management, required checks                        |
| Vercel                       | Environment-specific deployments, preview validation, controlled releases, rollback                     |
| Git and GitHub               | Branching, commits, PRs, code review, merge controls, traceability                                      |
| VS Code                      | Workspace configuration, extensions, debugging, integrated terminal, remote practices                   |
| AI Workspaces                | Clear prompting, repository context, privacy, human review, responsible use                             |
| Security and DevSecOps       | Least privilege, secret protection, dependency auditing, static analysis                                |
| Documentation                | Accurate, discoverable, version-controlled guidance and decision records                                |
| Monitoring and operations    | Log inspection, incident recording, recovery verification, performance monitoring                       |

</details>

<details>
<summary><b>Git and GitHub Standards and Practices</b></summary>

| Area                | Standards and Practices                                                            |
| ------------------- | ---------------------------------------------------------------------------------- |
| Branching           | `main → development → feature/*` promotion flow; branch from updated `development` |
| Pull requests       | Submit feature work through PRs into `development`; explain what/why/how tested    |
| Code review         | Review for correctness, maintainability, security, testing, consistency            |
| Branch protection   | Require agreed CI checks before merging into protected branches                    |
| Commit messages     | Consistent, meaningful messages describing the change                              |
| Change management   | Keep changes focused and traceable to their related work item                      |
| Conflict resolution | Update working branch, resolve carefully, rerun validation                         |
| Repository hygiene  | No secrets, generated artifacts, local env files, or unrelated changes             |
| GitHub Actions      | Automated checks as quality gates; investigate failures, don't bypass              |
| Release promotion   | Validate in `development` before promoting to production via `main`                |
| Recovery            | Use Git history + documented rollback process                                      |

</details>

<details>
<summary><b>Vercel Standards and Practices</b></summary>

| Area                    | Standards and Practices                                                      |
| ----------------------- | ---------------------------------------------------------------------------- |
| Project configuration   | Correct project roots, build commands, output directories per app            |
| Environment variables   | Configure per environment; never expose server secrets in frontend variables |
| Preview deployments     | Validate feature/development changes before production promotion             |
| Production deployment   | Deploy through the established `main` workflow                               |
| Build validation        | Confirm expected monorepo package/app is included in the build               |
| Deployment verification | Check deployed URL, behavior, logs, relevant user flows                      |
| Failure recovery        | Inspect logs, identify cause, use documented rollback                        |

_Project-specific implementation: GitHub Actions + Vercel CLI, as documented in `docs/deployment.md`._

</details>

<details>
<summary><b>Supabase and Database Standards and Practices</b></summary>

| Area             | Standards and Practices                                              |
| ---------------- | -------------------------------------------------------------------- |
| Data access      | Least-privilege access; define RLS policies for applicable tables    |
| Schema changes   | Version-controlled, reviewed migrations                              |
| Migration safety | Review generated SQL and understand impact before applying           |
| Credentials      | Keep privileged DB credentials server-side and out of source control |
| API integration  | Validate inputs and enforce authorization before DB operations       |
| Data integrity   | Appropriate constraints, relationships, validation rules             |
| Recovery         | Understand and verify backup/restore process                         |
| Testing          | Test DB behavior, access policies, and failure cases                 |

_Project-specific implementation: Drizzle ORM manages schema/migrations; Supabase hosts PostgreSQL and access control._

</details>

<details>
<summary><b>VS Code & Remote Explorer Standards and Practices</b></summary>

| Area                              | Standards and Practices                                                                     |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| Workspace                         | Open repository/workspace root to preserve project context                                  |
| Extensions                        | Use recommended extensions; review permissions and necessity                                |
| Formatting                        | Follow repository lint/format config, not personal editor rules                             |
| Terminal                          | Run commands from the correct workspace/package directory                                   |
| Debugging                         | Use breakpoints, logs, reproducible steps                                                   |
| Settings                          | Keep shared settings consistent; avoid committing machine-specific settings                 |
| Remote workspaces                 | Confirm remote target, path, and execution environment before editing                       |
| Credentials (remote)              | Approved auth methods only; never place secrets in source or shared settings                |
| File/terminal operations (remote) | Verify remote path and active host/directory before acting, especially destructive commands |
| Source control (remote)           | Verify repo, branch, and working-tree changes before committing/pushing                     |

**Validation checklist:** correct remote target selected · host and directory verified · correct repo/branch confirmed · terminal context understood · credentials handled securely · changes saved and persistence confirmed.

</details>

<details>
<summary><b>AI Workspace Standards and Practices</b></summary>

| Area               | Standards and Practices                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| Task definition    | State goal, context, constraints, expected output, acceptance criteria   |
| Repository context | Provide relevant files, structure, errors, logs, conventions             |
| Scope control      | Ask for focused changes; preserve architecture unless change is explicit |
| Prompt structure   | Separate problem, context, requirements, constraints, deliverable        |
| Code generation    | Request maintainable, typed, tested code following conventions           |
| Debugging          | Share exact errors and repro steps; find root causes, not workarounds    |
| Verification       | Independently review, run tests, linting, type checks, builds            |
| Security           | Never share passwords, secrets, keys, tokens, or confidential data       |
| Accuracy           | Verify commands/APIs/config against project documentation                |
| Human ownership    | Treat AI output as a proposal; developer owns correctness                |
| Documentation      | Convert repeated solutions into docs or reusable prompts                 |
| Learning           | Ask for explanations; record lessons learned                             |

</details>

<details>
<summary><b>CI/CD, Testing, Security, and Documentation Standards</b></summary>

| Area                                        | Standards and Practices                                                     |
| ------------------------------------------- | --------------------------------------------------------------------------- |
| CI workflow                                 | Run agreed lint, typecheck, test, and build checks consistently             |
| Unit / Integration / E2E / Contract testing | Validate logic, module interactions, user journeys, and API contracts       |
| Performance testing                         | Track against thresholds; investigate regressions                           |
| Security testing                            | Dependency audits, static analysis, secret checks, access-policy tests      |
| Merge control                               | Resolve required check failures before merging                              |
| Secrets & access                            | Keep secrets out of source/logs/prompts/bundles; least privilege everywhere |
| Documentation                               | Update guides/standards when workflows or architecture change               |
| Monitoring                                  | Inspect GitHub Actions and Vercel logs when investigating failures          |
| Incident handling                           | Record issue, impact, response, recovery, follow-up                         |

</details>

<details>
<summary><b>Analytics & Monitoring Standards and Practices</b></summary>

| Area                      | Standards and Practices                                                  |
| ------------------------- | ------------------------------------------------------------------------ |
| Event definition & naming | Define tracked interactions; use consistent, documented event names      |
| Event collection          | Send via `POST /api/events`; validate payloads server-side               |
| Data minimization         | Collect only what's needed; no secrets or unnecessary personal data      |
| Admin access              | Restrict `GET /api/events` to authorized administrative access           |
| Monitoring coverage       | Understand which layers (app, API, DB, deployment, security) are covered |
| API health                | Use `/health` for verification — note it is not continuous monitoring    |
| Incident documentation    | Record issue, impact, timeline, investigation, resolution, follow-up     |
| Continuous improvement    | Turn recurring failures into better docs, tests, and monitoring          |

</details>

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- REPORTING -->

## 📊 7. Reporting <a name="reporting"></a>

Reporting will eventually be automated. Recommended minimum set, generated manually until then:

| Report                | Frequency | Source                                                       |
| --------------------- | --------- | ------------------------------------------------------------ |
| Delivery report       | Weekly    | What merged to `development`/`main` this week                |
| Quality report        | Weekly    | CI pass/fail rate, test count trend                          |
| Security report       | Monthly   | `pnpm audit` findings, CodeQL alerts                         |
| Performance report    | Monthly   | Lighthouse CI score trend per route                          |
| Analytics report      | Monthly   | `/api/events` volume and top pages/CTAs                      |
| Technical debt report | Quarterly | Known gaps list (see each doc's "not yet implemented" notes) |

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- AUTOMATION -->

## 🤖 8. Automation <a name="automation"></a>

**Already automated**

- Linting, type checking, unit/integration/e2e/contract/performance tests (CI)
- Dependency vulnerability scanning (`pnpm audit`)
- Static code security analysis (CodeQL)
- Secret/credential leak detection (`security-validation.yml`)
- Build and deployment to staging/production

**Candidates for future automation**

- Weekly/monthly reporting (currently manual, per [Reporting](#reporting))
- Dependabot for automatic dependency version PRs
- Automated database backup verification
- Alerting on production errors (currently requires manually checking Vercel logs)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- BACKLOG -->

## 🗂 9. Backlog Management <a name="backlog"></a>

Recommended structure for tracking work (in GitHub Issues, or a project board):

| Field          | Example                                        |
| -------------- | ---------------------------------------------- |
| Description    | "Implement real Supabase Auth for admin login" |
| Why it matters | `ADMIN_TOKEN` is a documented security stopgap |
| Priority       | High                                           |
| Owner          | (sole maintainer currently)                    |
| Status         | Not started                                    |
| Next action    | Choose auth provider config, write ADR         |

**Current known backlog** (pulled from this project's own documentation):

- Real authentication (replace `ADMIN_TOKEN`)
- Bookings and Events admin UI (currently only Leads has a full UI)
- Blog content (flag exists, disabled, no real content)
- Analytics event tracking wired into real page interactions (endpoint exists, not yet called from real UI interactions)
- `services/analytics` (Python) — hosting decision pending
- Staging environment stable URL (current preview URLs change per deploy)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- EDUCATION -->

## 🎓 10. Education <a name="education"></a>

Topics relevant to this project's actual stack, for onboarding a future contributor (or refreshing your own knowledge):

- React + TypeScript fundamentals
- Vite build tooling
- Git branching and PR workflow (as practiced in this repo specifically)
- REST API design (the `/api/leads`, `/api/events`, `/api/bookings` pattern)
- Relational database basics + Drizzle ORM
- Testing pyramid concepts (unit vs. integration vs. e2e vs. contract)
- Row Level Security concepts (Postgres/Supabase specific)
- DevSecOps basics (see `docs/`'s DevSecOps lifecycle explanation)
- Working effectively with an AI coding assistant (prompt clarity, verifying suggestions, not blindly trusting generated code)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- SUPPORT -->

## 🆘 11. Support <a name="support"></a>

```
Problem
   ↓
Self-help (search docs/, check known gotchas table in
           docs/feature-implementation-guide.md)
   ↓
How-To Guide (see § 4. Guides)
   ↓
AI (Claude and ChatGPT, with actual error text/logs pasted in — not vague descriptions)
   ↓
Peer Help (not yet applicable — sole maintainer)
   ↓
Technology Support (external: Vercel support, Supabase support, GitHub support)
```

Self-serve first — the `docs/` folder's gotchas table exists specifically to reduce how often this ladder needs to go past step 2.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- RESEARCH -->

## 🔎 12. Research <a name="research"></a>

Areas worth tracking, specifically because they could affect this project — not general industry-watching:

- TypeScript's native/Go-based compiler rollout (already caused one real compatibility issue with `typescript-eslint`)
- Turborepo version changes (already caused pipeline→tasks and Strict Environment Mode issues)
- Vercel's monorepo build behavior (a pnpm registry bug this project worked around)
- Supabase Auth, as the eventual replacement for `ADMIN_TOKEN`
- Lighthouse/Core Web Vitals threshold changes

> Do not research everything — only things with a plausible, near-term impact on this specific project.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- OPERATIONS -->

## ⚙️ 13. Operations Management <a name="operations"></a>

| Area                  | Current State                                                                           | Gap                                                                      |
| --------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Health / Availability | Manually checking Vercel dashboard                                                      | No uptime monitoring or alerting configured                              |
| Errors                | Visible via Vercel function logs                                                        | No centralized error tracking (e.g. Sentry) integrated                   |
| Performance           | Tracked via Lighthouse CI on every feature branch push (warn-level threshold 0.8)       | —                                                                        |
| Incidents             | No real incident yet                                                                    | Recommended tracking: what broke, when, why, who fixed it, recovery time |
| Changes               | Tracked implicitly via git history and PR descriptions                                  | No separate change log maintained                                        |
| Releases              | Not yet formally versioned                                                              | Will use semantic versioning once the platform has real users            |
| Backup                | Supabase's automatic Postgres backups (frequency depends on plan tier)                  | Recovery has not been tested                                             |
| Recovery              | Vercel Instant Rollback; redeploy via `deploy.yml` or `vercel deploy --prebuilt --prod` | Database recovery relies on an untested backup system                    |

**Monitoring coverage**

| Layer       | Current coverage                                              |
| ----------- | ------------------------------------------------------------- |
| Application | None dedicated — manual checks only                           |
| API         | `/health` endpoint exists, not polled by any external monitor |
| Database    | Supabase dashboard (manual)                                   |
| Hosting     | Vercel dashboard (manual)                                     |
| Security    | `pnpm audit` + CodeQL, on push only (not continuous)          |
| Analytics   | `/api/events`, viewable in admin dashboard                    |

> **Honest summary:** Operations Management is the least mature section of this Enablement Foundation. Pre-release, manual checking is adequate; before handling real production traffic and real user data at scale, uptime monitoring, error tracking, and tested backup/recovery are the priority gaps to close.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- STATUS -->

## ✅ Status <a name="status"></a>

- [x] Systems documented
- [x] Assets identified
- [x] Templates identified (some created, some flagged as gaps)
- [x] Guides created
- [x] Toolkits created
- [x] Standards stored (`docs/standards.md`)
- [x] Reporting structure defined (not yet automated)
- [x] Automation inventory created (done + candidates)
- [x] Backlog structure + current items captured
- [x] Education topics identified
- [x] Support process defined
- [x] Research scope defined
- [x] Operations management documented (with honest gap list)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## License <a name="license"></a>

This project is [MIT](./LICENSE) licensed.

<p align="right">(<a href="#readme-top">back to top</a>)</p>
