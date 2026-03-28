# Implementation Plan

## Phase 1 — Project Setup

- Initialise monorepo structure (`/client`, `/server`)
- Set up Express + TypeScript server with basic health check route
- Set up React + TypeScript client with React Router
- Set up PostgreSQL database with Docker Compose
- Set up environment variable management (`.env` files)
- Configure ESLint and Prettier across both projects

## Phase 2 — Database Schema

- Design and create Prisma schema:
  - `User` (id, name, email, password hash, role, createdAt)
  - `Session` (id, userId, token, expiresAt)
  - `Ticket` (id, subject, body, status, category, createdAt, updatedAt)
  - `Message` (id, ticketId, body, sender, createdAt)
  - `KnowledgeBaseEntry` (id, title, content, embedding)
- Run initial migration
- Seed database with a default admin user

## Phase 3 — Authentication

- `POST /auth/login` — validate credentials, create database session
- `POST /auth/logout` — destroy session
- `GET /auth/me` — return current user from session
- Session middleware to protect routes
- Login page (React)
- Auth context and protected routes on the frontend

## Phase 4 — Ticket Management (Core)

- `POST /tickets` — create ticket manually
- `GET /tickets` — list tickets with filtering (status, category) and sorting
- `GET /tickets/:id` — get ticket detail with messages
- `PATCH /tickets/:id` — update status or category
- Ticket list page with filters and sorting
- Ticket detail page with message thread
- Create ticket form

## Phase 5 — Email Ingestion

- Configure inbound email webhook (Postmark or SendGrid)
- `POST /webhooks/inbound-email` — parse email payload, create ticket and first message
- Map email sender to existing user or store as contact
- Validate and secure the webhook endpoint

## Phase 6 — AI Features

- Integrate Claude API
- **Auto-classification** — on ticket creation, call Claude to assign category
- **AI summary** — generate a short summary of the ticket thread
- **AI-suggested reply** — generate a draft reply for the agent to review and edit
- **Auto-response** — for low-complexity tickets, auto-send a response using knowledge base context
- Display AI summary and suggested reply in ticket detail view
- Allow agent to edit suggested reply before sending

## Phase 7 — Knowledge Base

- Enable pgvector extension in PostgreSQL
- `POST /knowledge-base` — add a knowledge base entry (admin only)
- `GET /knowledge-base` — list all entries
- `DELETE /knowledge-base/:id` — remove an entry
- Generate and store embeddings for each entry via Claude API
- Use vector similarity search to retrieve relevant entries when generating AI responses
- Knowledge base management page (admin only)

## Phase 8 — User Management

- `POST /users` — create agent (admin only)
- `GET /users` — list all agents (admin only)
- `PATCH /users/:id` — update agent details (admin only)
- `DELETE /users/:id` — deactivate agent (admin only)
- User management page (admin only)

## Phase 9 — Dashboard

- Ticket stats: total, open, resolved, closed counts
- Breakdown by category
- Recent ticket activity feed
- Dashboard page (home screen after login)

## Phase 10 — Email Replies

- Integrate Resend to send outbound emails
- `POST /tickets/:id/messages` — send a reply (triggers outbound email)
- Link outbound replies to the original ticket thread
- Handle reply-to threading so follow-up emails from users append to the correct ticket

## Phase 11 — Docker & Deployment

- Write `Dockerfile` for the backend
- Write `Dockerfile` for the frontend
- Update `docker-compose.yml` with all services (client, server, postgres)
- Configure production environment variables
- Test full stack locally with Docker Compose
- Document deployment steps
