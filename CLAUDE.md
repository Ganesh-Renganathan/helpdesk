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

## Data Fetching (client)

- Use **axios** for all HTTP requests — never `fetch`
- Use **TanStack Query** (`@tanstack/react-query`) for all server state — never `useEffect` + `useState` for data fetching
- `QueryClientProvider` is set up in `client/src/main.tsx`

```ts
const { data, isPending, error } = useQuery({
  queryKey: ["resource"],
  queryFn: () => axios.get<ResponseType>("/api/resource").then((res) => res.data),
});
```

## Component Tests (Vitest + React Testing Library)

Test files live next to their source files: `src/pages/Users.test.tsx` alongside `Users.tsx`.

**Run commands** (from repo root):
```bash
bun run test:unit        # run once
bun run test:unit:watch  # watch mode
```

Or from `client/`:
```bash
bun run test       # run once
bun run test:watch # watch mode
```

**Stack**: Vitest + jsdom + React Testing Library + `@testing-library/jest-dom`. Setup file: `client/src/test/setup.ts`.

### Writing component tests

Always mock `axios` and `useAuth` — never hit real APIs or depend on auth state:

```ts
import { vi } from "vitest";
import axios from "axios";

vi.mock("axios");
vi.mock("../contexts/AuthContext", () => ({
  useAuth: () => ({ session: { user: { name: "Test Admin", role: "admin" } }, isPending: false, error: null }),
}));

const mockedAxios = vi.mocked(axios);
```

Wrap every render with `QueryClientProvider` (disable retries) and `MemoryRouter`:

```ts
function renderComponent() {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={queryClient}>
        <MyComponent />
      </QueryClientProvider>
    </MemoryRouter>
  );
}
```

Use `await screen.findBy*()` (async) after mocked API calls resolve. Use `screen.queryBy*()` to assert absence.

### Date formatting gotcha
Mock ISO timestamps at **noon UTC** (`T12:00:00.000Z`), not midnight, to avoid timezone-boundary off-by-one errors in `toLocaleDateString`.

## Writing E2E Tests

Use the **`playwright-e2e-writer`** agent for all Playwright test authoring. Invoke it via the Agent tool whenever:
- A new feature or page is completed
- A bug is fixed and regression coverage is needed
- Role-based access control is added to a route

The agent has full context on the test setup, credentials, selectors strategy, and Page Object Model conventions for this project.

## MCP Tools
- **context7** — use to fetch up-to-date documentation for any library, framework, or tool used in this project (React, Express, Prisma, Vite, Tailwind, shadcn/ui, etc.). Always prefer context7 over relying on training data for library-specific docs.