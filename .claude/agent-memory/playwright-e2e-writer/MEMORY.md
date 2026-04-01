# Playwright E2E Writer — Memory Index

- [Auth test infrastructure](project_auth_test_infra.md) — Playwright config, global-setup seed pattern, test DB, real admin user credentials
- [Login page selectors](project_login_page_selectors.md) — Confirmed selectors for Login page (shadcn Card/Input/Label/Button/Alert)
- [Auth flow details](project_auth_flow_details.md) — Better Auth session endpoint, Vite proxy, mock patterns for agent session and server errors
- [File layout](project_file_layout.md) — e2e/ directory structure: auth.spec.ts, pages/LoginPage.ts, helpers/auth.ts
- [Agent role testing approach](project_agent_role_testing.md) — No real agent DB user seeded; use page.route() to mock /api/auth/get-session for agent-role tests
