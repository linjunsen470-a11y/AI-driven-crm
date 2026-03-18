# n8n Baseline

This directory contains the first `n8n` baseline for the Maoshan AI CRM.

Current scope:

- receive AI job dispatches from CRM
- verify the shared webhook secret
- call CRM `/api/internal/ai-jobs/start`
- generate mock output by `jobType`
- call CRM `/api/internal/ai-jobs/callback`

This baseline does not yet include:

- real transcription provider calls
- object storage downloads
- OCR provider calls
- retry queues beyond native `n8n` retry handling

## Files

- `maoshan-ai-job-worker.workflow.json`: importable `n8n` workflow template

## Required Env Vars

The CRM side must provide:

- `CRM_INTERNAL_API_BASE_URL`
- `CRM_INTERNAL_API_TOKEN`
- `CRM_AI_JOB_START_PATH`
- `CRM_AI_JOB_CALLBACK_PATH`
- `N8N_BASE_URL`
- `N8N_AI_JOB_WEBHOOK_PATH`
- `N8N_WEBHOOK_SECRET`

The imported workflow expects this env var inside `n8n`:

- `N8N_WEBHOOK_SECRET`

## Expected Flow

1. CRM creates an `AiJob`
2. CRM dispatches the job to the `n8n` webhook
3. `n8n` calls CRM `start` to move the job into `running`
4. `n8n` builds mock output for `transcription`, `ocr`, or `extraction`
5. `n8n` calls CRM callback to complete or fail the job

## Local Testing

1. Import `maoshan-ai-job-worker.workflow.json` into `n8n`
2. Set `N8N_WEBHOOK_SECRET` in the `n8n` environment
3. Configure the CRM `.env` with:
   - `N8N_BASE_URL`
   - `N8N_AI_JOB_WEBHOOK_PATH=/webhook/maoshan-ai-job`
   - `N8N_WEBHOOK_SECRET`
   - `CRM_INTERNAL_API_BASE_URL`
   - `CRM_INTERNAL_API_TOKEN`
4. Start the CRM app and `n8n`
5. Create or upload an interaction and click `创建任务`
6. Confirm the job moves through `queued -> running -> completed`

## Next Step

Replace the mock code nodes with:

- storage fetch
- provider call
- normalized provider output
- richer failure and retry handling
