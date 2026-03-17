# Kimi Agent Handoff Guide

This document is the repo-native version of the remote implementation handoff plan.

Its purpose is to help a human owner package the right context for Kimi, keep priorities stable, and reject low-quality agent output.

---

## 1. Delivery Mode

Use `incremental slice delivery`, not a single giant build request.

Required implementation order:

1. Slice 0 + Slice 1
2. Slice 2 + Slice 3
3. Slice 4 + Slice 5

See `docs/implementation/mvp-slices.md` for the detailed slice definitions.

---

## 2. Context Priority

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
- first runnable loop is `text interaction -> AI extraction -> salesperson confirmation -> customer update`

---

## 3. Upload Pack

### Best package

Upload the full repo, not docs alone.

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
- `docs/MVP-API-与工作流设计.md`
- `docs/integrations/transcription-flow.md`
- `docs/AI-信息提取Prompt模板.md`
- `docs/advice.md`
- `docs/background.md`

### Optional reference docs

Allowed as lower-priority reference:

- `docs/Product Requirements Document.md`
- `docs/AI-CRM knowledge base.md`

### Default exclusions

Do not include these by default unless you want broad architecture rework:

- `docs/AI-Driven-CRM-架构分析与开发建议.md`
- `docs/design.md`
- `docs/最佳文件结构建议.md`

Reason:

- they are useful background
- but they are lower-priority than current implementation constraints
- they can easily dilute the main delivery path

---

## 4. AI-safe Environment Contract

Share `.env.example`, not your real `.env`.

Rules:

- agents may only reference variable names
- agents must never fabricate real secrets
- agents must never submit a real `.env`
- if new required env vars are added, `.env.example` must be updated in the same delivery
- only `NEXT_PUBLIC_*` vars may be used in browser code
- all other secrets stay server-side

---

## 5. Required Deliverables From Kimi

Every slice delivery must contain:

- directly applicable code changes
- a concise change summary
- a verification report with `pnpm typecheck`, `pnpm lint`, and when relevant `pnpm build`
- manual acceptance steps
- a remaining issues list
- doc updates if interfaces, prompts, env vars, or contracts changed

Acceptable code delivery formats:

- branch
- PR
- patch bundle
- full repo snapshot

---

## 6. Reject These Delivery Patterns

Reject the delivery if Kimi:

- only returns explanations without code
- claims it works without validation output
- invents a new project root or new stack without justification
- ignores `AGENTS.md`
- writes secrets into code or docs
- implements the whole roadmap in one uncontrolled batch

---

## 7. Slice Targets

### Round 1

- `Slice 0 + Slice 1`
- text interaction creation
- pending queue
- confirmation-to-customer base flow

### Round 2

- `Slice 2 + Slice 3`
- stronger confirmation form
- file upload
- `files` / `interactions` linkage

### Round 3

- `Slice 4 + Slice 5`
- `AiJob` driven transcription callback flow
- n8n or mock worker integration

---

## 8. Human Review Checklist

Before accepting a Kimi delivery, verify:

- it matches the requested slice only
- it respects current schema naming
- it does not bypass confirmation flow
- it does not add runtime prompt text only in docs
- it updates env and docs when required
- it explains any remaining blockers clearly

---

## 9. One-line Rule

Give Kimi enough truth to implement one slice well, not enough ambiguity to redesign the project by accident.
