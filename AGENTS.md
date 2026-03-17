# AGENTS.md

## Project Summary

This repository is an AI-driven CRM for a senior living / wellness community sales team.

Core product goals:

- capture customer follow-up data from audio, screenshots, and text
- extract structured customer profiles with AI
- support salesperson confirmation before writing to CRM master data
- provide knowledge-assisted sales chat and follow-up reminders

Current primary stack:

- Next.js App Router
- shadcn/ui
- Prisma + PostgreSQL
- planned n8n async workflows
- local filesystem / object storage for large source files
- `.env.example` is the configuration contract for local development
- Prisma 7 config lives in `prisma.config.ts`
- generated Prisma client lives under `generated/prisma`

---

## Current Repo Rules

### 1. Single project root only

Do not create nested app roots like `next-app/` again.

Keep the only application root at repository root.

### 2. Directory intent

- `app/`: route entrypoints and route handlers only
- `components/`: reusable UI only
- `features/`: business-domain logic and feature-local components
- `lib/`: cross-cutting infrastructure helpers
- `prisma/`: database schema and migrations
- `prompts/`: runtime prompt assets
- `docs/`: planning and architecture docs
- `infra/`: docker, n8n, deployment, local infra
- `scripts/`: dev and migration helpers

### 3. Runtime files vs docs

Do not keep production prompt text only inside planning docs.

If a prompt is used by code, move or duplicate it into `prompts/`.

Docs in `docs/` are for planning and reference, not the source of runtime truth.

### 4. Binary storage

Do not store large audio or image binaries in PostgreSQL.

Store only:

- storage path
- metadata
- hashes
- ownership / relations
- processing state

### 5. Environment variables

Do not hardcode secrets, endpoints, bucket names, or model names in app code.

Use:

- `.env` for local runtime secrets
- `.env.example` as the source of truth for required variables

If you add a required environment variable, update `.env.example`.

---

## Preferred Code Organization

Use domain-first structure under `features/`.

Recommended feature folders:

- `features/customers`
- `features/interactions`
- `features/ingestion`
- `features/chat`
- `features/knowledge`
- `features/reminders`
- `features/settings`

Inside each feature, prefer:

- `components/`
- `schemas/`
- `server/`
- `queries/`
- `utils/`

Avoid putting business logic directly into `app/` pages when it can live in a feature module.

---

## Database Source of Truth

Primary schema file:

- `prisma/schema.prisma`

Prisma config file:

- `prisma.config.ts`

Current schema status:

- customer profile model is detailed and well-aligned with planning
- interaction model is present and suitable for MVP
- phase-2 support tables now exist for knowledge, chat, reminders, ignored phones, call imports, files, tasks, AI jobs, and profile snapshots

When changing schema:

1. update `prisma/schema.prisma`
2. keep `prisma.config.ts` aligned if datasource or migration path changes
3. keep naming aligned with docs where reasonable
4. prefer explicit enums or constrained fields for business-critical values
5. keep AI extracted data and confirmed master data conceptually separate
6. import Prisma client from `@/generated/prisma/client`, not `@prisma/client`

---

## Current Gaps To Keep In Mind

The repository is not fully aligned with the full product plan yet.

Major missing pieces include:

- actual API routes
- actual Prisma migrations
- actual form schemas
- runtime prompt files under `prompts/`
- storage adapters
- n8n workflow definitions
- auth integration
- actual generated Prisma migration files from the local machine

Do not assume these already exist just because the docs describe them.

---

## First Build Priorities

When implementing, prefer this order:

1. customer / interaction MVP flow
2. confirmation form
3. upload + processing states
4. API routes for customers and interactions
5. prompt runtime files
6. n8n integration
7. knowledge base
8. reminders
9. AI chat

---

## Frontend Guidance

This is an internal workbench, not a marketing site.

Optimize for:

- fast scanning
- data density with clarity
- editable confirmation cards
- strong table and detail layouts
- obvious status display

Important UI surfaces:

- pending interactions queue
- customer confirmation form
- customer detail timeline
- reminders list
- AI chat workspace

---

## Vibe Coding Guidance

Vibe coding is acceptable for:

- page scaffolding
- CRUD shells
- component composition
- form scaffolding
- route skeletons

Be more deliberate with:

- schema changes
- AI extraction contracts
- profile merge logic
- permissions
- follow-up reminder logic
- file ingestion flows

---

## Documentation Hygiene

If you add new planning docs, place them under `docs/`.

If you add new implementation-critical conventions, update this file.
