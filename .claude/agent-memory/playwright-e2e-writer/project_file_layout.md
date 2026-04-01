---
name: E2E file layout
description: Directory structure of e2e/ folder — spec files, page objects, and helpers established so far
type: project
---

```
e2e/
├── auth.spec.ts            # Auth system tests (login, guards, RBAC, sign-out)
├── global-setup.ts         # Runs migrations + seed before all tests
├── global-teardown.ts      # No-op (DB preserved for inspection)
├── helpers/
│   └── auth.ts             # loginAs(), signOut(), expectRedirectedToLogin(), TEST_USERS
└── pages/
    └── LoginPage.ts        # POM for /login — fields, errors, goto(), fillAndSubmit()
```

`TEST_USERS` in `helpers/auth.ts` reads from env vars with fallback to the seeded values:
- `process.env.SEED_EMAIL ?? "test-admin@example.com"`
- `process.env.SEED_PASSWORD ?? "test-password-123"`
- `process.env.SEED_NAME ?? "Test Admin"`

**How to apply:** Add new spec files alongside `auth.spec.ts`. Add page objects in `e2e/pages/`. Add shared helpers (e.g. for a future agent loginAs) in `e2e/helpers/auth.ts`.
