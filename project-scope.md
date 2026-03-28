# AI-Powered ticket management System

## Problem

we receive hundreds of support emails daily. Our agents manually read, classify, and respond to each ticket, which is slow and leads to impersonal canned responses.

## Solution

Build a text ticket management system that uses AI to automatically classify, respond to, and route support tickets, delivering faster, more personalized responses to students while freeing up agents for complex issues.

## Features

- Receive support emails and create tickets
- Auto-generate human-friendly responses using a knowledge base
- Ticket list with filtering and sorting
- Ticket detail view
- AI-powered ticket classification
- AI summaries
- AI-suggested replies
- User management (admin only)
- Dashboard to view and manage all tickets

## Ticket Statuses

- **Open** — ticket has been received and is awaiting response
- **Resolved** — ticket has been responded to and the issue is considered addressed
- **Closed** — ticket has been confirmed resolved and is no longer active

## Ticket Categories

Each ticket belongs to exactly one category:

- **General Question** — general enquiries not fitting other categories
- **Technical Question** — technical or product-related issues
- **Refund Request** — requests for refunds or billing disputes

## User Roles

- **Admin** — deployed with the system; can create and manage agents
- **Agent** — created by admin; handles and responds to tickets
