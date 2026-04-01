---
name: Agent role testing approach
description: How to test agent-role behavior without a real seeded agent user — using page.route() to mock /api/auth/get-session
type: project
---

There is currently no agent user seeded in the test database. Only `test-admin@example.com` (role: admin) is seeded via global-setup.

For agent-role tests (e.g. verifying /users redirects to /, Navbar hides the Users link), use `mockAgentSession(page)` defined in `e2e/auth.spec.ts`:
- Intercepts `**/api/auth/get-session` with `route.fulfill()`
- Returns a fake session payload with `role: "agent"`
- Does NOT require a session cookie — the mock bypasses auth entirely

This approach tests the CLIENT-SIDE RBAC logic (ProtectedRoute, Navbar conditional rendering) but does NOT test server-side authorization for agent users.

To add a real agent user for higher-confidence tests:
1. Add a second `execSync("bun run seed", { env: { ...env, SEED_EMAIL: "test-agent@example.com", SEED_PASSWORD: "test-password-123", SEED_ROLE: "agent", SEED_NAME: "Test Agent" } })` call in `e2e/global-setup.ts`
2. Add `agent` key to `TEST_USERS` in `e2e/helpers/auth.ts`
3. Replace the mocked agent tests with `loginAs(page, "agent")`

**Why:** Only admin was seeded when the e2e infrastructure was first set up. Mocking is an acceptable interim solution for client-side RBAC tests.
**How to apply:** Always note in the test comment when a mock is substituting for a real user, so it's easy to find and upgrade later.
