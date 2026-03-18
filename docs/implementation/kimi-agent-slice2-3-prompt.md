# Kimi Agent Slice 2+3 Prompt

This document is kept as a historical reference.

It was the slice-specific prompt for the round that implemented:

- stronger confirmation flow
- single-file upload
- `files` / `interactions` linkage

That round has already landed in the current repository baseline.

Do not use this file as the default next-step prompt for new implementation work.

For current delegation, use:

- `docs/implementation/kimi-agent-handoff.md`
- `docs/implementation/kimi-agent-kickoff-prompt.md`

The original archived prompt is preserved below.

```text
You are working on an existing repository. Follow the repository truth and implement only the requested slice. Do not redesign the project and do not expand scope.

Repository truth priority:
1. AGENTS.md
2. prisma/schema.prisma
3. prisma.config.ts
4. .env.example
5. docs/to-update.md
6. docs/implementation/mvp-slices.md
7. docs/MVP-API-与工作流设计.md
8. docs/integrations/transcription-flow.md
9. other reference docs

Current baseline facts:
- Slice 1 already exists and is the starting point.
- Supabase is connected and the app can already run with `pnpm dev`.
- Use the current schema as-is. Do not add tables or rename existing core models.
- Async job abstraction is `AiJob`. Do not invent `TranscriptionJob`.
- Large binaries do not go into PostgreSQL.
- If runtime prompts are used, place them under `prompts/`.

Your git workflow:
- Base branch: `main`
- Create a new branch: `feat/slice2-3-confirmation-upload`
- Never work directly on `main`
- Do not rewrite git history
- Push only the feature branch
- Do not include unrelated local tooling noise such as `.agent`, `.agents`, `.claude`, or `Kimi_Agent_Code`

Task scope for this round:
Implement only Slice 2 + Slice 3.

Required outcomes:
1. Strengthen the interaction confirmation form
   - grouped fields and clearer editing UX
   - explicit distinction between AI-extracted values and salesperson-confirmed values
   - support `pending`, `confirmed`, `rejected`, and `partially_confirmed`
   - confirmation flow must remain gated by `processingStatus === completed`

2. Add single-file upload and interaction association
   - upload one file per action
   - create `File` metadata records
   - associate uploaded file with `Interaction`
   - validate MIME type and file size
   - show upload / processing state in the UI

Constraints:
- No schema changes unless absolutely required; assume schema is fixed for this round
- No n8n integration
- No transcription worker
- No OCR
- No auth integration
- No batch import
- No customer merge heuristics
- Keep business logic in `features/`
- Keep route handlers and pages in `app/`
- Import Prisma client from `@/generated/prisma/client`
- If you add required env vars, update `.env.example`
- Do not commit real secrets or a real `.env`

Implementation expectations:
- Reuse existing Slice 1 pages and APIs
- Extend current confirmation detail flow rather than rebuilding from scratch
- Keep the UI dense and workbench-oriented, not marketing-style
- Use existing shadcn/radix-style components and existing project conventions
- Prefer incremental changes over broad refactors

Validation required before delivery:
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build` if relevant
- manual verification steps for:
  - create text interaction
  - open pending queue
  - review interaction detail
  - partially confirm / reject / confirm
  - upload a file and see it associated to the interaction
  - verify file metadata persisted correctly

Delivery format:
1. Branch name
2. Short change summary
3. Files/subsystems changed
4. Validation results
5. Manual acceptance steps
6. Remaining issues / blockers

Reject your own output if:
- it changes unrelated files
- it introduces schema churn without strong necessity
- it expands into later slices
- it hardcodes secrets
- it provides explanation without actual code changes
```
