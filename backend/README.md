# Smart Invoice & Payroll Management — Backend

Multi-tenant SaaS backend for invoices, clients, employees and payroll.

**Stack:** Bun · TypeScript · Express 5 · MongoDB (Mongoose) · Redis + BullMQ · JWT · Brevo (email) · pdfkit (PDF)

## Prerequisites

- [Bun](https://bun.sh) ≥ 1.2
- MongoDB running locally or a connection string
- Redis running locally (required for queues, workers and rate limiting)

## Setup

```bash
bun install
cp .env.example .env   # then fill in the values
```

Key environment variables (see `.env.example`): `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `SUPERADMIN_SEED_EMAIL`, `SUPERADMIN_SEED_PASSWORD`.

## Running

```bash
# API server (http://localhost:8000)
bun run dev

# Background workers (email, pdf, payroll, reminders) — separate process
bun run dev:worker

# Seed the platform super admin (uses SUPERADMIN_SEED_* from .env)
bun run seed:superadmin

# Type-check
bun run typecheck
```

Production: `bun run start` and `bun run start:worker`.

- API base path: `/api/v1`
- Swagger UI: `/api/docs`
- Full endpoint reference: [`API_DOCUMENTATION.md`](./API_DOCUMENTATION.md)
- Architecture & data model: [`BACKEND_DESIGN.md`](./BACKEND_DESIGN.md)

## Core flow

1. A company registers → `pending`.
2. Super admin approves → approval email is queued.
3. Company admin logs in → completes onboarding (`/company/setup`) → default invoice templates are seeded.
4. Full access to invoices, clients, employees, payroll and dashboards — every query scoped to `companyId` from the JWT.

## Project structure

```
src/
├── config/        env, db, redis, brevo, constants (enums)
├── controllers/   request handlers (one per resource)
├── lib/           token, email, pdf (render + pdfkit), storage, logger, swagger
├── middlewares/   auth, tenant, rbac, validate, error, notFound, sanitize, rateLimit, upload
├── models/        Mongoose schemas
├── queues/        BullMQ producers (email, pdf, payroll, reminder)
├── routers/       Express routers, combined in routers/index.ts under /api/v1
├── schemas/       Zod request validation
├── templates/     HTML email templates
├── utils/         apiError, apiResponse, pagination, calculators, helpers
├── workers/       BullMQ consumers + worker bootstrap (workers/index.ts)
├── scripts/       seedSuperAdmin
└── index.ts       app bootstrap
```
