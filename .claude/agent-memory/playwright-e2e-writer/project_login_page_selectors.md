---
name: Login page selectors
description: Confirmed Playwright selectors for all Login page elements (shadcn components, validation errors, server alert)
type: project
---

Login page at `/login` uses shadcn `Card/Input/Label/Button/Alert`.

Confirmed working selectors:
- Email field: `page.getByLabel("Email address")` — Label htmlFor="email" with text "Email address"
- Password field: `page.getByLabel("Password")` — Label htmlFor="password"
- Submit button: `page.getByRole("button", { name: /sign in/i })` — text "Sign in" (idle) or "Signing in…" (loading)
- Email validation error: `page.getByText("Enter a valid email address")` — from Zod schema
- Password validation error: `page.getByText("Password is required")` — from Zod schema
- Server error alert: `page.getByRole("alert")` — shadcn Alert component has role="alert"
- Page heading: `page.getByRole("heading", { name: "Welcome back" })`
- Subheading: `page.getByText("Sign in to your account to continue")`

Form uses `react-hook-form` + `zodResolver`. noValidate on the `<form>` means browser validation is disabled; all validation is client-side via Zod.

Left decorative panel is `hidden lg:flex` — only visible at width >= 1024px.

**How to apply:** Use these exact selectors in any test touching the login page. The POM is at `e2e/pages/LoginPage.ts`.
