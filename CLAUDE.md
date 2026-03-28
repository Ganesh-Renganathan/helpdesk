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

## MCP Tools
- **context7** — use to fetch up-to-date documentation for any library, framework, or tool used in this project (React, Express, Prisma, Vite, Tailwind, shadcn/ui, etc.). Always prefer context7 over relying on training data for library-specific docs.