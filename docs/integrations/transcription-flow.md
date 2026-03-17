# Audio Transcription Flow

## Purpose

This document defines the recommended transcription integration for the Maoshan AI CRM.

It is intentionally aligned with the current repository state:

- CRM source of truth lives in Next.js + Prisma
- the current schema already has `files`, `interactions`, and `ai_jobs`
- asynchronous transcription should use `AiJob` with `jobType = transcription`
- n8n is a worker/orchestrator, not the system of record

This document describes the target integration pattern for audio processing after the text-first MVP is stable.

---

## Scope

This flow covers:

1. audio file upload metadata
2. interaction creation
3. transcription job creation
4. worker execution through n8n or a local worker
5. CRM callback writeback
6. UI-visible status changes

This flow does not define:

- customer merge logic
- extraction prompt design
- OCR workflow
- bulk call import

---

## Design Principles

1. CRM owns business truth
2. binary files stay out of PostgreSQL
3. all async work is traceable through `ai_jobs`
4. callback handlers must be authenticated and idempotent
5. worker logic may evolve from local mock -> local service -> n8n without changing CRM contracts too much

---

## Current Entity Mapping

### File

Use the existing `File` model for uploaded source files.

Relevant fields in current schema include:

- `category`
- `status`
- `storageBucket`
- `storagePath`
- `originalName`
- `mimeType`
- `fileSizeBytes`
- `sha256`
- `durationSeconds`

### Interaction

Use the existing `Interaction` model as the user-facing follow-up record.

Relevant fields in current schema include:

- `contactMethod`
- `contentType`
- `storageBucket`
- `storagePath`
- `mimeType`
- `sourceText`
- `transcription`
- `processingStatus`
- `aiSummary`
- `aiSalesSuggestion`
- `aiExtractedData`

### AiJob

Use the existing `AiJob` model for asynchronous work.

Recommended transcription mapping:

- `jobType = transcription`
- `status = queued | running | completed | failed`
- `interactionId` points to the related interaction
- `inputPayload` stores worker request metadata
- `outputPayload` stores transcript result, segments, provider usage, and provider ids

Do not introduce a parallel `transcription_jobs` table unless the project later proves the unified `AiJob` model is insufficient.

---

## Suggested Processing Order

### Stage 0: text-first MVP

Before building this full flow, first stabilize:

- manual text interaction creation
- AI extraction output display
- salesperson confirmation
- customer update flow

This reduces variables and keeps the first shipping loop small.

### Stage 1: upload and metadata

For audio interactions, CRM should:

1. validate file type and size
2. upload the binary to local storage or MinIO
3. create a `files` row
4. create an `interactions` row with `contentType = audio`
5. create an `ai_jobs` row with `jobType = transcription`

### Stage 2: dispatch async work

CRM sends a minimal metadata payload to a worker.

Preferred payload shape:

- `jobId`
- `interactionId`
- `fileId`
- `storageBucket`
- `storagePath`
- `mimeType`
- `callbackUrl`
- `languageHint`

The worker should fetch the binary from storage, not receive the full audio file inline from CRM.

### Stage 3: worker execution

The worker:

1. authenticates the inbound request
2. loads the file from storage
3. sends it to the transcription provider
4. normalizes the result
5. calls back into CRM

### Stage 4: CRM callback writeback

CRM callback logic should:

1. authenticate request
2. verify job exists
3. reject invalid state transitions
4. write transcript result into `ai_jobs.outputPayload`
5. update `ai_jobs.status`
6. update `interactions.transcription`
7. update `interactions.processingStatus`

---

## Recommended State Model

### `ai_jobs.status`

- `queued`
- `running`
- `completed`
- `failed`
- `cancelled`

### `interactions.processingStatus`

Recommended practical mapping:

- `pending`: interaction created, work not yet started
- `processing`: upload accepted and worker running
- `completed`: transcript written back and downstream parsing may continue
- `failed`: transcription failed and requires retry or manual handling

---

## Interface Contract Guidance

This document stays human-readable on purpose.

If the team later needs a machine-readable contract for AI-assisted generation or workflow testing, add:

- `docs/integrations/transcription-contract.json`

Keep that JSON file derived from the real CRM contract, not the other way around.

---

## Worker Choices

### Option A: local mock worker

Best for the first implementation slice.

Use it when you want to verify:

- job creation
- callback authentication
- idempotent writes
- UI state changes

without depending on n8n or an external provider.

### Option B: n8n workflow

Recommended after the CRM-side contract is stable.

Use n8n for:

- webhook entry
- storage fetch
- provider orchestration
- retries
- callback delivery

Do not move customer merge logic or confirmed CRM writes into n8n.

---

## Security Rules

1. worker entrypoints must be authenticated
2. CRM callback endpoints must be authenticated
3. provider credentials must stay server-side
4. internal callback endpoints are not public APIs
5. all secrets live in `.env` or deployment secret storage
6. `.env.example` only contains placeholders and required variable names

---

## Failure Handling

### CRM side

CRM should:

- preserve failure details in `ai_jobs`
- keep callbacks idempotent
- avoid double-writing completed jobs
- allow explicit retry by creating a new job or resetting state deliberately

### Worker side

Workers should:

- retry transient provider errors
- stop after max attempts
- include normalized error details in callbacks
- log provider request ids when available

---

## What To Build Next

Recommended implementation order:

1. text-only interaction flow
2. file upload adapter
3. `AiJob` creation and local mock worker
4. authenticated callback route
5. n8n workflow integration

That order is slower at the start but much safer overall, especially when using vibe coding.
