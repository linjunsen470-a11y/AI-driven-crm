# Async Processing Contract

The CRM remains the system of record.

Workers may:

- claim queued `AiJob`s
- process transcription / OCR / extraction tasks
- call back into CRM with final status and output payload

Workers must not:

- write confirmed customer master data directly
- maintain CRM business truth outside CRM
- bypass callback authentication or idempotency

Current supported CRM-side job contracts:

- `transcription`: audio file metadata in, transcription text out
- `ocr`: image file metadata in, recognized text and summary out
- `extraction`: source text in, summary / suggestion / structured data / confidence out
