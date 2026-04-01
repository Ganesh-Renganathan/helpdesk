import { type Page, expect } from "@playwright/test";

/**
 * Seeded test credentials.
 *
 * These match the values in server/.env.test and are populated by the
 * global-setup.ts seed step. Override via environment variables if needed.
 *
 * NOTE: Only the admin user is seeded. There is currently no agent test user.
 * Agent-role tests requiring a real session would need a second seed step.
 */
export const TEST_USERS = {
  admin: {
    email: process.env.SEED_EMAIL ?? "test-admin@example.com",
    password: process.env.SEED_PASSWORD ?? "test-password-123",
    name: process.env.SEED_NAME ?? "Test Admin",
    role: "admin" as const,
  },
} as const;

/**
 * Log in as the given role and wait for redirect to "/".
 *
 * Uses the real login form — no session injection — so the full auth
 * flow (Better Auth → session cookie) is exercised.
 */
export async function loginAs(
  page: Page,
  role: keyof typeof TEST_USERS
): Promise<void> {
  const { email, password } = TEST_USERS[role];

  await page.goto("/login");
  await page.getByLabel("Email address").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: /sign in/i }).click();
  await page.waitForURL("/");
}

/**
 * Sign out via the Navbar button and wait for redirect to "/login".
 */
export async function signOut(page: Page): Promise<void> {
  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL("/login");
}

/**
 * Assert the browser is on the login page (used after auth-guard redirects).
 */
export async function expectRedirectedToLogin(page: Page): Promise<void> {
  await page.waitForURL("/login");
  await expect(
    page.getByRole("heading", { name: "Welcome back" })
  ).toBeVisible();
}
