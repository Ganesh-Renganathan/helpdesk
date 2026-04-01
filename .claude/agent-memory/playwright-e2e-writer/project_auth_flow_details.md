---
name: Auth flow details
description: Better Auth session endpoint URL, Vite proxy behavior, and page.route() patterns for mocking auth in tests
type: project
---

Better Auth client calls these endpoints (relative to origin, proxied by Vite to :8080):
- Sign in: POST `/api/auth/sign-in/email`
- Get session: GET `/api/auth/get-session`
- Sign out: POST `/api/auth/sign-out`

`authClient` in `client/src/lib/auth-client.ts` has no explicit baseURL, so it uses the current page origin (`:3000`). Vite proxies `/api/*` to `:8080`.

For `page.route()` mocks in tests, use glob patterns:
- `"**/api/auth/sign-in/email"` — intercept sign-in
- `"**/api/auth/get-session"` — intercept session lookup

Agent session mock response shape (to fake an authenticated agent user):
```json
{
  "session": { "id": "...", "userId": "...", "expiresAt": "...", ... },
  "user": { "id": "...", "email": "...", "name": "...", "role": "agent", ... }
}
```

After login success, `Login.tsx` calls `navigate("/", { replace: true })` in the `onSuccess` callback.
After sign-out, `Navbar.tsx` calls `navigate("/login", { replace: true })` in the `fetchOptions.onSuccess` callback.
`ProtectedRoute` returns `null` (renders nothing) while `isPending` is true — tests should await `waitForURL` rather than asserting immediately.

**How to apply:** Use these patterns when writing tests that need to mock auth state without a real DB user, or when testing error responses from the auth API.
