# Helpdesk Project

## Project Overview
AI-powered ticket management system that automatically classifies, responds to, and routes support tickets.

## Structure
```
helpdesk/
├── client/        # React + TypeScript + Vite (port 3000)
└── server/        # Express + TypeScript + Bun (port 8080)
```

## Tech Stack
- **Frontend**: React, TypeScript, React Router, Tailwind CSS, shadcn/ui
- **Backend**: Node.js, Express, TypeScript, Bun
- **ORM**: Prisma
- **Database**: PostgreSQL + pgvector
- **AI**: Claude API (Anthropic)
- **Auth**: Database sessions
- **Deployment**: Docker

## Running the Project
```bash
bun run dev:server   # Express API on :8080
bun run dev:client   # React/Vite on :3000
```

The Vite dev server proxies `/api/*` requests to `http://localhost:8080`.

## Authentication

Auth is handled by **Better Auth** with email/password only. **Sign-up is disabled** — users must be seeded directly into the database.

### Server (`server/src/lib/auth.ts`)
- `betterAuth` configured with Prisma adapter (PostgreSQL)
- All auth routes mounted at `/api/auth/*` via `toNodeHandler(auth)`
- Trusted origins from `TRUSTED_ORIGINS` env var (default: `http://localhost:3000`)

### Protecting routes
Use the `requireAuth` middleware (`server/src/middleware/requireAuth.ts`):
```ts
app.get("/api/some-route", requireAuth, (req, res) => {
  const { session } = res.locals; // { user, session }
});
```
The middleware calls `auth.api.getSession()` and attaches the session to `res.locals.session`. Returns `401` if unauthenticated.

For admin-only routes, chain `requireAdmin` **after** `requireAuth`:
```ts
import { requireAdmin } from "./middleware/requireAdmin";

app.get("/api/admin-route", requireAuth, requireAdmin, (req, res) => { ... });
```
Returns `403` if the user's role is not `admin`. **Never rely solely on client-side `ProtectedRoute adminOnly`** — it is not a security boundary.

### Client (`client/src/lib/auth-client.ts`)
```ts
import { authClient } from "@/lib/auth-client";

// Sign in
await authClient.signIn.email({ email, password }, { onSuccess, onError });

// Sign out
await authClient.signOut();
```

Session state is available app-wide via `useAuth()` hook (`client/src/contexts/AuthContext.tsx`):
```ts
const { session, isPending, error } = useAuth();
```
`AuthProvider` wraps the app in `main.tsx`.

### User model
- Roles: `admin` | `agent` (Prisma enum, default: `agent`)
- Tables: `user`, `session`, `account`, `verification`
- Seed users: `bun run seed` (runs `server/prisma/seed.ts`) — supports `SEED_ROLE` env var (default: `admin`)

```bash
# Create admin (default)
SEED_EMAIL=admin@example.com SEED_PASSWORD=secret bun run seed

# Create agent
SEED_EMAIL=agent@example.com SEED_PASSWORD=secret SEED_NAME=Agent SEED_ROLE=agent bun run seed
```

### Exposing custom user fields in the session
Better Auth does **not** include custom Prisma fields (e.g. `role`) in the session by default. To expose them:

**Server** — declare in `user.additionalFields`:
```ts
user: {
  additionalFields: {
    role: { type: "string", input: false },
  },
},
```

**Client** — add `inferAdditionalFields` plugin:
```ts
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "../../../server/src/lib/auth";

export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
```

### Role-based access (client)
`ProtectedRoute` in `client/src/App.tsx` accepts an `adminOnly` prop — non-admins are redirected to `/`:
```tsx
<Route path="/users" element={<ProtectedRoute adminOnly><Users /></ProtectedRoute>} />
```
Admin-only nav links use `session?.user.role === "admin"` in `Navbar.tsx`.

## shadcn/ui Setup (client)

- **Config**: `client/components.json` — style: "default", baseColor: "slate", cssVariables: true
- **Path alias**: `@` → `./src` (configured in `vite.config.ts` and `tsconfig.json`)
- **CSS variables**: defined in `client/src/index.css` (light + dark mode)
- **`cn()` helper**: `client/src/lib/utils.ts`
- **Components directory**: `client/src/components/ui/`
- **Installed components**: `button`, `input`, `label`, `card`, `alert`
- **Adding components**: `npx shadcn@latest add <component>` from `client/`

### Tailwind v3 gotcha
Never use `@apply` with custom theme color names (e.g. `bg-background`, `border-border`) inside `@layer base` in `index.css` — Tailwind v3 cannot resolve them there. Use raw CSS instead:
```css
/* Wrong */
body { @apply bg-background text-foreground; }

/* Correct */
body {
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
}
```

## Testing (Playwright)

E2e tests live in `e2e/` at the repo root. Playwright is installed as a root devDependency.

```bash
bun run test:e2e          # run all tests (headless)
bun run test:e2e:ui       # interactive UI mode
bun run test:e2e:headed   # headed browser
bun run test:e2e:debug    # debug mode
bun run test:db:reset     # drop + recreate helpdesk_test DB
```

### Test database
A separate `helpdesk_test` database is used — never the dev `helpdesk` DB. Config in `server/.env.test` (gitignored; copy from `server/.env.test.example`).

- **Test user**: `test-admin@example.com` / `test-password-123` (role: `admin`)
- `global-setup.ts` runs `prisma migrate deploy` + seeds the test user automatically before each run
- Test DB is preserved between runs for inspection; `bun run test:db:reset` wipes it

### `playwright.config.ts`
- `webServer` starts both the Express server (`:8080`) and Vite client (`:3000`) automatically
- `globalSetup` loads `server/.env.test` into `process.env` before web servers start, so the server process inherits the test `DATABASE_URL`
- `NODE_ENV=test` in `.env.test` disables the auth rate limiter (rate limiting is production-only via `skip: () => process.env.NODE_ENV !== "production"`)

## MCP Tools
- **context7** — use to fetch up-to-date documentation for any library, framework, or tool used in this project (React, Express, Prisma, Vite, Tailwind, shadcn/ui, etc.). Always prefer context7 over relying on training data for library-specific docs.