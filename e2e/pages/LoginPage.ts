import { type Page, type Locator, expect } from "@playwright/test";

/**
 * Page Object Model for the Login page at /login.
 *
 * Selector rationale:
 *  - Email/Password inputs: getByLabel() via the shadcn <Label htmlFor> association
 *  - Submit button: getByRole('button') with accessible name
 *  - Validation errors: text is rendered in a <p> directly below each field
 *  - Server error alert: rendered inside shadcn <Alert variant="destructive">
 */
export class LoginPage {
  readonly page: Page;

  // Form fields
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  // Error surfaces
  readonly emailError: Locator;
  readonly passwordError: Locator;
  readonly serverErrorAlert: Locator;

  // Headings / descriptive text used for presence assertions
  readonly heading: Locator;
  readonly subheading: Locator;

  constructor(page: Page) {
    this.page = page;

    this.emailInput = page.getByLabel("Email address");
    this.passwordInput = page.getByLabel("Password");
    this.submitButton = page.getByRole("button", { name: /sign in/i });

    this.emailError = page.getByText("Enter a valid email address");
    this.passwordError = page.getByText("Password is required");
    this.serverErrorAlert = page.getByRole("alert");

    this.heading = page.getByRole("heading", { name: "Welcome back" });
    this.subheading = page.getByText("Sign in to your account to continue");
  }

  async goto() {
    await this.page.goto("/login");
    await expect(this.heading).toBeVisible();
  }

  /**
   * Fill credentials and click submit. Does NOT wait for navigation —
   * callers are responsible for asserting the outcome.
   */
  async fillAndSubmit(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.submitButton.click();
  }

  /**
   * Convenience: submit without typing anything (trigger required-field errors).
   */
  async submitEmpty() {
    await this.submitButton.click();
  }

  /** Assert the button is in its loading state ("Signing in…"). */
  async expectLoadingState() {
    await expect(
      this.page.getByRole("button", { name: /signing in/i })
    ).toBeVisible();
  }

  /** Assert the page is in its idle (non-loading) state. */
  async expectIdleState() {
    await expect(this.submitButton).toBeVisible();
    await expect(this.submitButton).toBeEnabled();
  }
}
