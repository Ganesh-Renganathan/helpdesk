# Tech Stack

## Frontend

- **React with TypeScript** — UI framework
- **React Router** — client-side routing
- **Tailwind CSS + shadcn/ui** — styling and UI components

## Backend

- **Node.js with Express and TypeScript** — REST API server

## ORM

- **Prisma** — type-safe database access

## Database

- **PostgreSQL** — relational database for tickets, users, and categories
- **pgvector** — PostgreSQL extension for knowledge base embeddings

## AI

- **Claude API (Anthropic)** — ticket classification, summaries, suggested replies, and auto-responses

## Email

- **Postmark Inbound** or **SendGrid Inbound Parse** — receives inbound emails and creates tickets via webhook
- **Resend** — sends AI-generated replies to users

## Authentication

- **Database sessions** — session tokens stored in PostgreSQL, managed via Express middleware

## Deployment

- **Docker** — containerised deployment for frontend, backend, and database
