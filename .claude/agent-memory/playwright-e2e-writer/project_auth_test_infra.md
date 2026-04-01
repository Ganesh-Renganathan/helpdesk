---
name: Auth test infrastructure
description: Playwright config, global-setup seed pattern, test DB setup, and real test user credentials
type: project
---

Playwright config is at repo root `playwright.config.ts`. testDir is `./e2e`. Workers=1, fullyParallel=false. Two webServer entries: server (`bun run --cwd server src/index.ts`, health check at :8080/api/health) and client (`bun run --cwd client dev`, :3000).

Global setup at `e2e/global-setup.ts` loads `server/.env.test`, runs `bunx prisma migrate deploy`, then `bun run seed` to populate the test DB. Global teardown preserves the DB for inspection.

Test database: `helpdesk_test` on port 5433 (PostgreSQL in Docker). Connection string in `server/.env.test`.

Seeded test user (admin):
- email: `test-admin@example.com`
- password: `test-password-123`
- name: `Test Admin`
- role: `admin`

The seed script reads SEED_EMAIL/SEED_PASSWORD/SEED_NAME/SEED_ROLE from env. It skips if user already exists (idempotent).

Rate limiter in `server/src/index.ts` uses `skip: () => process.env.NODE_ENV !== "production"` — effectively disabled in NODE_ENV=test.

**Why:** Global setup does migrations + seed so tests always start from a known state.
**How to apply:** When adding new test users, update `server/.env.test` and the global-setup seed calls. Currently only one seed call (admin). An agent user needs a second `execSync("bun run seed", ...)` call with `SEED_ROLE=agent`.
