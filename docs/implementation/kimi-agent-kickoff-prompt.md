# Kimi Agent Kickoff Prompt

Use this as the initial instruction when delegating work to Kimi.

```text
You are implementing against an existing repository. Follow repository truth, not your own defaults.

Priority of source of truth:
1. AGENTS.md
2. prisma/schema.prisma
3. prisma.config.ts
4. .env.example
5. docs/to-update.md
6. docs/implementation/mvp-slices.md
7. docs/MVP-API-与工作流设计.md
8. docs/integrations/transcription-flow.md
9. other reference docs

Mandatory rules:
- Keep a single project root only.
- Do not create nested app roots.
- Do not invent a TranscriptionJob model.
- Use AiJob as the unified async job abstraction.
- Do not store large audio or image binaries in PostgreSQL.
- If a runtime prompt is used by code, move or duplicate it into prompts/.
- If you add a required environment variable, update .env.example.
- Do not expose real secrets. Only use placeholder env variable names.
- First runnable loop is text interaction -> AI extraction -> salesperson confirmation -> customer update.

Working mode:
- Implement only the requested slice.
- Do not silently expand into later slices.
- Keep business logic in features/, not app/ pages.
- Import Prisma client from @/generated/prisma/client.

Required delivery format:
- code changes
- concise change summary
- validation report including pnpm typecheck and pnpm lint, plus pnpm build if relevant
- manual acceptance steps
- remaining issues / blockers

Reject conditions for your own output:
- explanation without code
- unverified claims
- undocumented schema changes
- hardcoded secrets

Current request:
Implement only the slice I specify next. If repository materials conflict, follow the highest-priority file.
```
