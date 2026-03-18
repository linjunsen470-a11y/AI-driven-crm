# Kimi Agent Handoff Guide

This document is the repo-native handoff plan for remote implementation work.

It reflects the current reality of the project:

- Slice 0 to Slice 3 are already implemented
- CRM-side Slice 4 contract is already landed
- `AiJob` is the unified async abstraction
- runtime prompts now live under `prompts/`
- the current baseline passes `npm run typecheck`, `npm run lint`, and `npm run build`
- `n8n` Batch 1 baseline already exists and should be extended instead of replaced

---

## 1. Delivery Mode

Use `incremental slice delivery`, not a single giant build request.

Current recommended implementation order from the present baseline:

1. Slice 5: `n8n` integration on top of the existing `AiJob` flow
2. Phase 2 CRM-side modules that are not blocked by `n8n`
3. Slice 6 style expansion for OCR / summary / extraction unification

See `docs/implementation/mvp-slices.md` for the slice definitions and current status.

Current recommended next round:

- `Slice 5`
- keep CRM as the system of record
- reuse the existing callback route and job payload contract
- reuse the existing `/api/internal/ai-jobs/start` route
- do not rebuild completed Slice 2 / Slice 3 functionality

Optional parallel round if `n8n` work is intentionally deferred:

- knowledge base CRUD shell
- AI chat session/message shell
- reminders / ignored phones / call import CRM-side status flows

---

## 2. Repository Truth And Baseline

When materials conflict, Kimi must use this order:

1. `AGENTS.md`
2. `prisma/schema.prisma`
3. `prisma.config.ts`
4. `.env.example`
5. `docs/to-update.md`
6. `docs/implementation/mvp-slices.md`
7. `docs/MVP-API-与工作流设计.md`
8. `docs/integrations/transcription-flow.md`
9. other business and prompt reference docs

Explicit rules Kimi must follow:

- do not create nested app roots
- do not invent a `TranscriptionJob` model
- use `AiJob` as the unified async job abstraction
- do not treat historical planning docs as higher priority than repo truth
- first runnable loop remains `text interaction -> AI extraction -> salesperson confirmation -> customer update`
- do not base work on a local dirty worktree or ad hoc exported folders

Current baseline facts:

- the app is already runnable
- text interaction creation, confirmation, customer writeback, and single-file upload already exist
- `AiJob` queue / running / callback / mock worker flow already exists on the CRM side
- CRM -> `n8n` dispatch and `n8n` workflow template already exist
- start path is `/api/internal/ai-jobs/start`
- callback path is `/api/internal/ai-jobs/callback`
- current build baseline is green
- `n8n` is not yet wired into the real provider path

---

## 3. Git Flow

### Human owner flow

Before delegating the next round:

1. merge the current baseline into `main`
2. push remote `main`
3. ensure unrelated local noise is not part of that merge

Important:

- do not ask Kimi to build on top of an unpushed local branch
- do not let Kimi inherit `.agent`, `.agents`, `.claude`, or `Kimi_Agent_Code` noise

### Kimi flow

Kimi must use this sequence:

1. `git clone`
2. create a slice-specific branch from `origin/main`
3. implement only the requested slice
4. run validation
5. push the feature branch

Suggested branch names from the current baseline:

- `feat/slice5-n8n-integration`
- `feat/phase2-crm-knowledge-chat-shell`
- `feat/phase2-crm-reminders-import-shell`

Kimi must:

- never work directly on `main`
- never rewrite history
- only deliver a feature branch unless explicitly asked to open a PR

---

## 4. Access And Secrets

Share `.env.example`, not your real `.env`.

Rules:

- agents may only reference variable names
- agents must never fabricate real secrets
- agents must never submit a real `.env`
- if new required env vars are added, `.env.example` must be updated in the same delivery
- only `NEXT_PUBLIC_*` vars may be used in browser code
- all other secrets stay server-side

GitHub access guidance:

- use a short-lived fine-grained token
- scope it to this repo only
- minimum recommended permission is `Contents: Read and write`
- add `Pull requests: Read and write` only if you want Kimi to open PRs directly
- never place the token in prompt text, docs, code, or `.env.example`

---

## 5. Upload Pack

### Best package

Give Kimi the full repo from remote `main`, not docs alone.

Minimum recommended package:

- `app/`
- `components/`
- `features/`
- `lib/`
- `prisma/`
- `prompts/`
- `infra/`
- `scripts/`
- `generated/prisma/`
- `package.json`
- `tsconfig.json`
- `next.config.mjs`
- `components.json`
- `eslint.config.mjs`
- `AGENTS.md`
- `.env.example`

### Mandatory docs

These docs must be included:

- `AGENTS.md`
- `.env.example`
- `prisma/schema.prisma`
- `prisma.config.ts`
- `docs/to-update.md`
- `docs/implementation/mvp-slices.md`
- `docs/implementation/kimi-agent-handoff.md`
- `docs/implementation/kimi-agent-kickoff-prompt.md`
- `docs/MVP-API-与工作流设计.md`
- `docs/integrations/transcription-flow.md`
- `docs/AI-信息提取Prompt模板.md`
- `docs/advice.md`
- `docs/background.md`

Historical reference only:

- `docs/implementation/kimi-agent-slice2-3-prompt.md`

### Default exclusions

Do not include these by default unless you want broad architecture rework:

- `docs/AI-Driven-CRM-架构分析与开发建议.md`
- `docs/design.md`
- `docs/最佳文件结构建议.md`
- `.agent/`
- `.agents/`
- `.claude/`
- `Kimi_Agent_Code/`

---

## 6. Required Deliverables From Kimi

Every slice delivery must contain:

- directly applicable code changes
- a concise change summary
- a verification report with `npm run typecheck`, `npm run lint`, and when relevant `npm run build`
- manual acceptance steps
- a remaining issues list
- doc updates if interfaces, prompts, env vars, or contracts changed

Preferred delivery format for this project:

- feature branch pushed to remote

Also acceptable when needed:

- PR
- patch bundle

---

## 7. Reject These Delivery Patterns

Reject the delivery if Kimi:

- only returns explanations without code
- claims it works without validation output
- invents a new project root or new stack without justification
- ignores `AGENTS.md`
- writes secrets into code or docs
- implements the whole roadmap in one uncontrolled batch
- changes unrelated local tooling noise or cleanup files outside the requested slice

---

## 8. Slice Targets From The Current Baseline

### Already landed

- `Slice 0 + Slice 1`
- `Slice 2 + Slice 3`
- CRM-side baseline for `Slice 4`

### Next recommended round

- `Slice 5`
- `n8n` or equivalent worker-orchestration integration
- keep `start`, callback idempotency, and CRM writeback boundaries unchanged

### After that

- `Slice 6`
- OCR, summary, and extraction unification
- Phase 2 CRM-side modules

---

## 9. Human Review Checklist

Before accepting a Kimi delivery, verify:

- it matches the requested slice only
- it respects current schema naming
- it does not bypass confirmation flow
- it does not add runtime prompt text only in docs
- it updates env and docs when required
- it explains any remaining blockers clearly
- it is based on clean remote `main`
- it does not regress the existing green build baseline

---

## 10. One-line Rule

Build on the current CRM baseline one slice at a time; do not redesign already-completed work just because `n8n` is still missing.
