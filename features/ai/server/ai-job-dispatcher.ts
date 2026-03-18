import {
  AiJobStatus,
  AiJobType,
  type Prisma,
} from "@/generated/prisma/client"

import type {
  ExtractionJobPayload,
  OcrJobPayload,
  TranscriptionJobPayload,
} from "@/features/ai/server/ai-job-contracts"
import { aiJobService } from "@/features/ai/server/ai-job-service"

export type AiJobDispatchStatus = "dispatched" | "skipped" | "failed"

export interface AiJobDispatchResult {
  status: AiJobDispatchStatus
  jobId: string
  message: string
  targetUrl?: string
  responseStatus?: number
}

interface N8nDispatchConfig {
  baseUrl: string
  webhookPath: string
  webhookSecret: string
  requestTimeoutMs: number
  crmBaseUrl: string
  crmInternalToken: string
  crmCallbackPath: string
  crmStartPath: string
}

interface N8nAiJobWebhookPayload {
  source: "maoshan-crm"
  requestedAt: string
  job: {
    id: string
    jobType: AiJobType
    status: AiJobStatus
    interactionId: string | null
    retryCount: number
  }
  input:
    | TranscriptionJobPayload
    | OcrJobPayload
    | ExtractionJobPayload
    | Record<string, unknown>
  crm: {
    startUrl: string
    callbackUrl: string
    authToken: string
  }
}

function getRequiredEnv(name: string) {
  const value = process.env[name]?.trim()
  return value ? value : null
}

function getN8nDispatchConfig(): N8nDispatchConfig | null {
  const baseUrl = getRequiredEnv("N8N_BASE_URL")
  const webhookSecret = getRequiredEnv("N8N_WEBHOOK_SECRET")
  const crmBaseUrl = getRequiredEnv("CRM_INTERNAL_API_BASE_URL")
  const crmInternalToken = getRequiredEnv("CRM_INTERNAL_API_TOKEN")

  if (!baseUrl || !webhookSecret || !crmBaseUrl || !crmInternalToken) {
    return null
  }

  const requestTimeoutMsRaw = process.env.N8N_REQUEST_TIMEOUT_MS?.trim()
  const requestTimeoutMs = requestTimeoutMsRaw
    ? Number.parseInt(requestTimeoutMsRaw, 10)
    : 15000

  return {
    baseUrl,
    webhookSecret,
    crmBaseUrl,
    crmInternalToken,
    webhookPath: process.env.N8N_AI_JOB_WEBHOOK_PATH?.trim() || "/webhook/maoshan-ai-job",
    crmCallbackPath:
      process.env.CRM_AI_JOB_CALLBACK_PATH?.trim() || "/api/internal/ai-jobs/callback",
    crmStartPath:
      process.env.CRM_AI_JOB_START_PATH?.trim() || "/api/internal/ai-jobs/start",
    requestTimeoutMs:
      Number.isFinite(requestTimeoutMs) && requestTimeoutMs > 0 ? requestTimeoutMs : 15000,
  }
}

function buildAbsoluteUrl(baseUrl: string, path: string) {
  return new URL(path, baseUrl).toString()
}

function toPayloadRecord(payload: Prisma.JsonValue) {
  if (typeof payload !== "object" || payload === null || Array.isArray(payload)) {
    return {}
  }

  return payload as Record<string, unknown>
}

function toWorkerInput(jobType: AiJobType, payload: Prisma.JsonValue) {
  const input = toPayloadRecord(payload)

  switch (jobType) {
    case AiJobType.transcription:
      return input as unknown as TranscriptionJobPayload
    case AiJobType.ocr:
      return input as unknown as OcrJobPayload
    case AiJobType.extraction:
      return input as unknown as ExtractionJobPayload
    default:
      return input
  }
}

function buildDispatchPayload(
  job: NonNullable<Awaited<ReturnType<typeof aiJobService.getJob>>>,
  config: N8nDispatchConfig,
): N8nAiJobWebhookPayload {
  return {
    source: "maoshan-crm",
    requestedAt: new Date().toISOString(),
    job: {
      id: job.id,
      jobType: job.jobType,
      status: job.status,
      interactionId: job.interactionId ?? null,
      retryCount: job.retryCount,
    },
    input: toWorkerInput(job.jobType, job.inputPayload),
    crm: {
      startUrl: buildAbsoluteUrl(config.crmBaseUrl, config.crmStartPath),
      callbackUrl: buildAbsoluteUrl(config.crmBaseUrl, config.crmCallbackPath),
      authToken: config.crmInternalToken,
    },
  }
}

function withRequestTimeout(timeoutMs: number) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  return {
    signal: controller.signal,
    clear() {
      clearTimeout(timeout)
    },
  }
}

export async function dispatchAiJob(jobId: string): Promise<AiJobDispatchResult> {
  const job = await aiJobService.getJob(jobId)

  if (!job) {
    throw new Error("Job not found")
  }

  if (job.status === AiJobStatus.completed || job.status === AiJobStatus.cancelled) {
    return {
      status: "skipped",
      jobId,
      message: `Job ${jobId} is already finalized.`,
    }
  }

  if (job.status === AiJobStatus.running) {
    return {
      status: "skipped",
      jobId,
      message: `Job ${jobId} is already running.`,
    }
  }

  const config = getN8nDispatchConfig()

  if (!config) {
    return {
      status: "skipped",
      jobId,
      message:
        "n8n dispatch is not configured. Set N8N_BASE_URL, N8N_WEBHOOK_SECRET, CRM_INTERNAL_API_BASE_URL, and CRM_INTERNAL_API_TOKEN to enable webhook dispatch.",
    }
  }

  const targetUrl = buildAbsoluteUrl(config.baseUrl, config.webhookPath)
  const request = withRequestTimeout(config.requestTimeoutMs)

  try {
    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${config.webhookSecret}`,
        "x-maoshan-source": "crm",
      },
      body: JSON.stringify(buildDispatchPayload(job, config)),
      signal: request.signal,
    })

    if (!response.ok) {
      const responseText = await response.text()

      return {
        status: "failed",
        jobId,
        targetUrl,
        responseStatus: response.status,
        message: responseText
          ? `n8n webhook returned ${response.status}: ${responseText}`
          : `n8n webhook returned ${response.status}.`,
      }
    }

    return {
      status: "dispatched",
      jobId,
      targetUrl,
      responseStatus: response.status,
      message: `Job ${jobId} was dispatched to n8n.`,
    }
  } catch (error) {
    return {
      status: "failed",
      jobId,
      targetUrl,
      message:
        error instanceof Error
          ? `Failed to dispatch job to n8n: ${error.message}`
          : "Failed to dispatch job to n8n.",
    }
  } finally {
    request.clear()
  }
}
