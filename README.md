# Maoshan AI CRM

AI-driven CRM for a senior living / wellness community sales team.

## Current Stack

- Next.js App Router
- shadcn/ui
- Prisma 7 + PostgreSQL
- planned n8n async workflows
- local filesystem / MinIO style object storage

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
- `docs/implementation/kimi-agent-slice2-3-prompt.md`
- `.env.example`

## Current Delivery Strategy

The project should be built in slices, not as one giant batch.

Recommended order:

1. text interaction MVP flow
2. confirmation form
3. upload + processing states
4. customers / interactions APIs
5. runtime prompts
6. n8n integration
7. knowledge base
8. reminders
9. AI chat
