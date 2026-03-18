import { AiJobStatus, AiJobType } from "@/generated/prisma/client"

import type {
  ExtractionJobOutput,
  OcrJobOutput,
  TranscriptionJobOutput,
} from "@/features/ai/server/ai-job-contracts"
import { extractCustomerDataFromText } from "@/features/ai/server/extract-customer-data"
import { aiJobService } from "@/features/ai/server/ai-job-service"

function getPayloadValue(payload: Record<string, unknown>, key: string) {
  const value = payload[key]
  return typeof value === "string" ? value : undefined
}

function buildMockTranscription(payload: Record<string, unknown>): TranscriptionJobOutput {
  const originalName = getPayloadValue(payload, "originalName") ?? "音频附件"

  return {
    transcription: `[MOCK TRANSCRIPTION] 已处理 ${originalName}。客户表达了进一步了解项目、安排到访和确认预算范围的意向。`,
  }
}

function buildMockOcr(payload: Record<string, unknown>): OcrJobOutput {
  const originalName = getPayloadValue(payload, "originalName") ?? "图片附件"

  return {
    text: `[MOCK OCR] 已识别 ${originalName} 中的文字内容，包含客户姓名、联系电话与看房诉求。`,
    summary: "图片内容已识别，可继续做结构化提取。",
  }
}

async function buildMockExtraction(
  payload: Record<string, unknown>,
): Promise<ExtractionJobOutput> {
  const sourceText =
    getPayloadValue(payload, "sourceText") ?? "客户电话咨询项目，准备近期到访。"
  const extraction = await extractCustomerDataFromText(sourceText)

  return {
    summary: extraction.summary,
    salesSuggestion: extraction.salesSuggestion,
    extractedData: extraction.extractedData,
    confidence: extraction.confidence,
    extractionVersion: "mock-worker-v1",
    modelName: "mock-ai-worker",
  }
}

export async function runMockAiJob(jobId: string) {
  const job = await aiJobService.getJob(jobId)

  if (!job) {
    throw new Error("Job not found")
  }

  if (job.status === AiJobStatus.completed || job.status === AiJobStatus.cancelled) {
    return {
      job,
      alreadyFinalized: true,
    }
  }

  const runningJob =
    job.status === AiJobStatus.running ? job : await aiJobService.markJobRunning(job.id)

  const payload =
    typeof runningJob.inputPayload === "object" && runningJob.inputPayload !== null
      ? (runningJob.inputPayload as Record<string, unknown>)
      : {}

  switch (runningJob.jobType) {
    case AiJobType.transcription:
      await aiJobService.completeJob(jobId, buildMockTranscription(payload))
      break
    case AiJobType.ocr:
      await aiJobService.completeJob(jobId, buildMockOcr(payload))
      break
    case AiJobType.extraction:
      await aiJobService.completeJob(jobId, await buildMockExtraction(payload))
      break
    default:
      await aiJobService.failJob(
        jobId,
        `Mock worker does not support job type: ${runningJob.jobType}`,
      )
      break
  }

  return {
    job: await aiJobService.getJob(jobId),
    alreadyFinalized: false,
  }
}
