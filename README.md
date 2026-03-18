# Maoshan AI CRM

AI-driven CRM for a senior living / wellness community sales team.

## Current Stack

- Next.js App Router
- shadcn/ui
- Prisma 7 + PostgreSQL
- local filesystem / MinIO-style object storage
- unified `AiJob` async contract inside CRM
- `n8n` baseline workflow assets under `infra/n8n`

## Current Delivery Status

As of the current baseline:

- Slice 0 is complete
- Slice 1 is complete
- Slice 2 is complete
- Slice 3 is complete
- Slice 4 CRM-side contract is in place
- Slice 5 Batch 1 is in place, but real provider integration is not finished yet

What already exists in code:

- text interaction creation and pending queue
- interaction confirmation and customer writeback
- single-file upload and `files` / `interactions` linkage
- unified `AiJob` routes, callback handling, and local mock worker
- CRM -> `n8n` dispatch, internal `start` route, and workflow template
- runtime prompts under `prompts/`

Validation status of the current baseline:

- `npm run typecheck` passes
- `npm run lint` passes
- `npm run build` passes

## Source Of Truth

When docs conflict, use this priority:

1. `AGENTS.md`
2. `prisma/schema.prisma`
3. `prisma.config.ts`
4. `.env.example`
5. `docs/to-update.md`
6. `docs/implementation/mvp-slices.md`

## Remote Agent Handoff

If you want to delegate implementation to an external coding agent such as Kimi, start here:

- `docs/implementation/kimi-agent-handoff.md`
- `docs/implementation/kimi-agent-kickoff-prompt.md`
- `.env.example`

Historical reference only:

- `docs/implementation/kimi-agent-slice2-3-prompt.md`

## Current Delivery Strategy

The project should still be built in slices, not as one giant batch.

Recommended next order:

1. complete Slice 5 `n8n` integration on top of the existing `AiJob` contract
2. build Phase 2 CRM-side modules that do not depend on `n8n`
3. add knowledge base and AI chat shells
4. add reminders, ignored phones, and call import state flows
5. connect real providers and larger async workflows incrementally
