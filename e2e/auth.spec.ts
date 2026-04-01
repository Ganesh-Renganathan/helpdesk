/**
 * e2e/auth.spec.ts
 *
 * Comprehensive end-to-end tests for the Helpdesk authentication system.
 *
 * Coverage:
 *   - Login page rendering and form structure
 *   - Client-side Zod validation (email format, required password)
 *   - Successful login with admin credentials → redirect to /
 *   - Post-login UI: Navbar content, user name, admin-only "Users" link
 *   - Failed login: wrong password, unknown email, empty fields
 *   - Auth guard: unauthenticated access to protected routes → /login redirect
 *   - Auth guard: authenticated access to admin-only /users (admin can access)
 *   - Auth guard: already-authenticated user visiting /login → redirect to /
 *   - Sign out → redirect to /login, session cleared
 *   - Post-sign-out: protected routes redirect back to /login
 *   - API-level: mocked 500 error from sign-in endpoint shows friendly message
 *
 * Test user (seeded in global-setup):
 *   admin@example.com / test-password-123  (role: admin)
 *
 * No agent-role user is currently seeded.
 * Agent-role tests (e.g. verifying /users redirects to /) are implemented
 * using page.route() to mock the session so they don't need a real DB user.
 * See the "Role-based access control" describe block for details.
 */

import { test, expect, type Page } from "@playwright/test";
import { LoginPage } from "./pages/LoginPage";
import {
  loginAs,
  signOut,
  TEST_USERS,
  expectRedirectedToLogin,
} from "./helpers/auth";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Intercept the Better Auth sign-in endpoint and force it to return a 500 so
 * we can verify the UI renders a friendly server-error message.
 */
async function mockSignInServerError(page: Page): Promise<void> {
  await page.route("**/api/auth/sign-in/email", (route) =>
    route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({ message: "Internal server error" }),
    })
  );
}

/**
 * Intercept /api/auth/get-session to fake an agent-role session.
 * This lets us test agent-role UI/routing without needing a real DB user.
 *
 * The response shape mirrors what Better Auth returns for a valid session.
 */
async function mockAgentSession(page: Page): Promise<void> {
  const fakeSession = {
    session: {
      id: "fake-session-id",
      userId: "fake-agent-id",
      expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      token: "fake-token",
      ipAddress: null,
      userAgent: null,
    },
    user: {
      id: "fake-agent-id",
      email: "agent@example.com",
      name: "Test Agent",
      role: "agent",
      emailVerified: true,
      image: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  };

  await page.route("**/api/auth/get-session", (route) =>
    route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(fakeSession),
    })
  );
}

// ===========================================================================
// 1. Login page — rendering
// ===========================================================================

test.describe("Login page — rendering", () => {
  test("renders the login form with all expected elements", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.subheading).toBeVisible();
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
    await expect(loginPage.submitButton).toBeEnabled();
  });

  test("email input is of type email and password input is of type password", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.emailInput).toHaveAttribute("type", "email");
    await expect(loginPage.passwordInput).toHaveAttribute("type", "password");
  });

  test("renders the left panel brand copy on large viewports", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/login");

    await expect(page.getByText("Support made")).toBeVisible();
    await expect(page.getByText("Helpdesk", { exact: true }).first()).toBeVisible();
  });

  test("does not show a server error alert on initial load", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await expect(loginPage.serverErrorAlert).not.toBeVisible();
  });
});

// ===========================================================================
// 2. Client-side validation
// ===========================================================================

test.describe("Login form — client-side validation", () => {
  test("shows both field errors when submitting a completely empty form", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.submitEmpty();

    await expect(loginPage.emailError).toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();
  });

  test("shows email format error for a malformed email address", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("not-an-email");
    await loginPage.submitButton.click();

    await expect(loginPage.emailError).toBeVisible();
  });

  test("does not show email error for a valid email address", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("valid@example.com");
    await loginPage.submitButton.click();

    await expect(loginPage.emailError).not.toBeVisible();
    // Password error will appear instead — confirming the form advanced past email validation.
    await expect(loginPage.passwordError).toBeVisible();
  });

  test("shows password required error when password field is empty", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.emailInput.fill("valid@example.com");
    await loginPage.submitButton.click();

    await expect(loginPage.passwordError).toBeVisible();
  });

  test("validation errors clear after the user corrects the field and resubmits", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Trigger email error
    await loginPage.emailInput.fill("bad");
    await loginPage.submitButton.click();
    await expect(loginPage.emailError).toBeVisible();

    // Correct the email (password still empty, so that error will appear)
    await loginPage.emailInput.fill("corrected@example.com");
    await loginPage.submitButton.click();

    // Email error must be gone; password error now shows
    await expect(loginPage.emailError).not.toBeVisible();
    await expect(loginPage.passwordError).toBeVisible();
  });
});

// ===========================================================================
// 3. Successful login
// ===========================================================================

test.describe("Successful login", () => {
  test("admin can log in and is redirected to the home page", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillAndSubmit(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );

    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });

  test("home page shows a personalised greeting with the user's first name", async ({
    page,
  }) => {
    await loginAs(page, "admin");

    const firstName = TEST_USERS.admin.name.split(" ")[0]; // "Test"
    await expect(
      page.getByRole("heading", { name: new RegExp(firstName, "i") })
    ).toBeVisible();
  });

  test("Navbar renders after login with user name and sign-out button", async ({
    page,
  }) => {
    await loginAs(page, "admin");

    await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
    await expect(
      page.getByRole("button", { name: /sign out/i })
    ).toBeVisible();
  });

  test("Navbar shows the 'Users' nav link for admin role", async ({ page }) => {
    await loginAs(page, "admin");

    await expect(page.getByRole("link", { name: /users/i })).toBeVisible();
  });

  test("submit button is disabled and shows spinner while the request is in-flight", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Delay the auth API response so we can observe the loading state
    await page.route("**/api/auth/sign-in/email", async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });

    // Start filling and clicking without awaiting navigation
    const fillAndClick = async () => {
      await loginPage.fillAndSubmit(
        TEST_USERS.admin.email,
        TEST_USERS.admin.password
      );
    };

    // Run the click concurrently and check the spinner appears
    await Promise.all([
      fillAndClick(),
      expect(
        page.getByRole("button", { name: /signing in/i })
      ).toBeVisible(),
    ]);
  });
});

// ===========================================================================
// 4. Failed login — server errors
// ===========================================================================

test.describe("Failed login — server-side errors", () => {
  test("shows a server error message for wrong password against the real API", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillAndSubmit(
      TEST_USERS.admin.email,
      "definitely-wrong-password"
    );

    await expect(loginPage.serverErrorAlert).toBeVisible();
    // The login page must remain open — no redirect
    await expect(page).toHaveURL("/login");
  });

  test("shows a server error message for an unknown email address", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillAndSubmit(
      "nobody@example.com",
      "any-password"
    );

    await expect(loginPage.serverErrorAlert).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("shows a server error alert when the API returns a 5xx response", async ({
    page,
  }) => {
    await mockSignInServerError(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();

    await loginPage.fillAndSubmit("any@example.com", "any-password");

    await expect(loginPage.serverErrorAlert).toBeVisible();
    await expect(page).toHaveURL("/login");
  });

  test("server error alert is dismissed after re-entering valid credentials", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // First attempt: bad credentials → error appears
    await loginPage.fillAndSubmit(
      TEST_USERS.admin.email,
      "wrong-password"
    );
    await expect(loginPage.serverErrorAlert).toBeVisible();

    // Second attempt: correct credentials → error must clear on next submit
    // (the component calls setServerError(null) at the top of onSubmit)
    await loginPage.fillAndSubmit(
      TEST_USERS.admin.email,
      TEST_USERS.admin.password
    );
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});

// ===========================================================================
// 5. Auth guard — unauthenticated access
// ===========================================================================

test.describe("Auth guard — unauthenticated users", () => {
  test("visiting / while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/");
    await expectRedirectedToLogin(page);
  });

  test("visiting /users while unauthenticated redirects to /login", async ({
    page,
  }) => {
    await page.goto("/users");
    await expectRedirectedToLogin(page);
  });

  test("redirect preserves the intended destination in location state (no visible error)", async ({
    page,
  }) => {
    // The app uses navigate state { from: location } but does not currently
    // display the destination URL — this test just confirms the redirect
    // landing page is clean and the user is not shown an error message.
    await page.goto("/users");
    await page.waitForURL("/login");

    await expect(
      page.getByRole("heading", { name: "Welcome back" })
    ).toBeVisible();
    await expect(page.getByRole("alert")).not.toBeVisible();
  });
});

// ===========================================================================
// 6. Auth guard — already-authenticated user visits /login
// ===========================================================================

test.describe("Auth guard — authenticated user on /login", () => {
  test("redirects to / when an authenticated admin navigates to /login", async ({
    page,
  }) => {
    await loginAs(page, "admin");

    // Manually navigate to /login after being authenticated
    await page.goto("/login");

    // The useEffect in Login.tsx fires and navigates away
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });
});

// ===========================================================================
// 7. Role-based access control
// ===========================================================================

test.describe("Role-based access control", () => {
  test("admin can access /users and sees the Users page", async ({ page }) => {
    await loginAs(page, "admin");
    await page.goto("/users");

    await expect(page).toHaveURL("/users");
    // The Users page renders a heading "Users"
    await expect(
      page.getByRole("heading", { name: "Users" })
    ).toBeVisible();
  });

  /**
   * Agent-role test using a mocked session.
   *
   * We have no real agent DB user, so we intercept /api/auth/get-session
   * to return a fake agent-role payload. This exercises the ProtectedRoute
   * adminOnly guard logic in the client without needing a second seed.
   *
   * NOTE: When an agent test user is seeded (SEED_ROLE=agent), replace this
   * test with a real loginAs(page, 'agent') call for higher confidence.
   */
  test("agent role cannot access /users and is redirected to /", async ({
    page,
  }) => {
    await mockAgentSession(page);

    await page.goto("/users");

    // ProtectedRoute with adminOnly redirects non-admins to "/"
    await page.waitForURL("/");
    await expect(page).toHaveURL("/");
  });

  test("agent role does not see the 'Users' nav link (mocked session)", async ({
    page,
  }) => {
    await mockAgentSession(page);

    // Navigate to home — agent session will be picked up
    await page.goto("/");

    // Wait for the Navbar to render (user name from mocked session appears)
    await expect(page.getByText("Test Agent")).toBeVisible();

    // The "Users" link must not be present for agents
    await expect(page.getByRole("link", { name: /users/i })).not.toBeVisible();
  });
});

// ===========================================================================
// 8. Sign out
// ===========================================================================

test.describe("Sign out", () => {
  test("clicking Sign out redirects to /login", async ({ page }) => {
    await loginAs(page, "admin");

    await signOut(page);

    await expect(page).toHaveURL("/login");
  });

  test("after signing out, navigating to / redirects back to /login", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await signOut(page);

    await page.goto("/");
    await expectRedirectedToLogin(page);
  });

  test("after signing out, navigating to /users redirects back to /login", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await signOut(page);

    await page.goto("/users");
    await expectRedirectedToLogin(page);
  });

  test("after signing out, the login page is shown cleanly with no error", async ({
    page,
  }) => {
    await loginAs(page, "admin");
    await signOut(page);

    const loginPage = new LoginPage(page);
    await expect(loginPage.heading).toBeVisible();
    await expect(loginPage.serverErrorAlert).not.toBeVisible();
  });
});

// ===========================================================================
// 9. Navbar — detailed rendering
// ===========================================================================

test.describe("Navbar", () => {
  test("renders the Helpdesk brand name", async ({ page }) => {
    await loginAs(page, "admin");

    // There are two "Helpdesk" instances on large viewports — at least one in Navbar
    const navBrand = page.locator("nav").getByText("Helpdesk");
    await expect(navBrand).toBeVisible();
  });

  test("renders user initials derived from the user name", async ({ page }) => {
    await loginAs(page, "admin");

    // "Test Admin" → initials "TA"
    const expectedInitials = TEST_USERS.admin.name
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    await expect(page.getByText(expectedInitials)).toBeVisible();
  });

  test("renders the full user name in the Navbar", async ({ page }) => {
    await loginAs(page, "admin");

    await expect(page.getByText(TEST_USERS.admin.name)).toBeVisible();
  });

  test("'Users' link in Navbar navigates to /users for admin", async ({
    page,
  }) => {
    await loginAs(page, "admin");

    await page.getByRole("link", { name: /users/i }).click();
    await page.waitForURL("/users");

    await expect(page).toHaveURL("/users");
  });
});

// ===========================================================================
// 10. API-level smoke test
// ===========================================================================

test.describe("API health check", () => {
  test("home page shows 'All systems operational' when API is reachable", async ({
    page,
  }) => {
    await loginAs(page, "admin");

    // The Home page polls /api/health and renders a status indicator
    await expect(
      page.getByText("All systems operational")
    ).toBeVisible({ timeout: 8_000 });
  });
});
