import { AiJobStatus, AiJobType, Prisma, ProcessingStatus } from "@/generated/prisma/client"

import { db } from "@/lib/db"

export interface CreateAiJobInput {
  jobType: AiJobType
  interactionId?: string
  knowledgeDocumentId?: string
  callImportItemId?: string
  followupRecommendationId?: string
  targetType?: string
  targetId?: string
  inputPayload?: Record<string, unknown>
  ownerId?: string
}

export interface ListAiJobsFilters {
  status?: AiJobStatus
  jobType?: AiJobType
  interactionId?: string
  limit?: number
  offset?: number
}

export class AiJobService {
  async createJob(input: CreateAiJobInput) {
    const job = await db.aiJob.create({
      data: {
        jobType: input.jobType,
        interactionId: input.interactionId,
        knowledgeDocumentId: input.knowledgeDocumentId,
        callImportItemId: input.callImportItemId,
        followupRecommendationId: input.followupRecommendationId,
        targetType: input.targetType,
        targetId: input.targetId,
        inputPayload: input.inputPayload ?? {},
        status: AiJobStatus.queued,
        ownerId: input.ownerId,
      },
      select: {
        id: true,
        jobType: true,
        status: true,
        interactionId: true,
        retryCount: true,
        createdAt: true,
      },
    })

    if (input.interactionId) {
      await db.interaction.update({
        where: { id: input.interactionId },
        data: { processingStatus: ProcessingStatus.pending },
      })
    }

    return job
  }

  async getJob(jobId: string) {
    return db.aiJob.findUnique({
      where: { id: jobId },
      select: {
        id: true,
        jobType: true,
        status: true,
        interactionId: true,
        inputPayload: true,
        outputPayload: true,
        errorMessage: true,
        retryCount: true,
        startedAt: true,
        finishedAt: true,
        createdAt: true,
      },
    })
  }

  async getPendingJobs(limit = 10) {
    return db.aiJob.findMany({
      where: {
        status: {
          in: [AiJobStatus.queued, AiJobStatus.failed],
        },
        retryCount: {
          lt: 3,
        },
      },
      orderBy: { createdAt: "asc" },
      take: limit,
      select: {
        id: true,
        jobType: true,
        status: true,
        interactionId: true,
        inputPayload: true,
        retryCount: true,
      },
    })
  }

  async listJobs(filters: ListAiJobsFilters = {}) {
    const { status, jobType, interactionId, limit = 20, offset = 0 } = filters
    const where: Prisma.AiJobWhereInput = {}
    const safeLimit = Math.min(Math.max(limit, 1), 100)
    const safeOffset = Math.max(offset, 0)

    if (status) {
      where.status = status
    }

    if (jobType) {
      where.jobType = jobType
    }

    if (interactionId) {
      where.interactionId = interactionId
    }

    return db.aiJob.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        jobType: true,
        status: true,
        interactionId: true,
        errorMessage: true,
        retryCount: true,
        createdAt: true,
        startedAt: true,
        finishedAt: true,
      },
    })
  }

  async incrementRetryCount(jobId: string) {
    return db.aiJob.update({
      where: { id: jobId },
      data: {
        retryCount: {
          increment: 1,
        },
      },
    })
  }

  async completeJob(jobId: string, outputPayload: Record<string, unknown>) {
    const job = await db.aiJob.update({
      where: { id: jobId },
      data: {
        status: AiJobStatus.completed,
        outputPayload,
        finishedAt: new Date(),
      },
      include: {
        interaction: true,
      },
    })

    if (!job.interactionId || !job.interaction) {
      return job
    }

    switch (job.jobType) {
      case AiJobType.transcription:
        await db.interaction.update({
          where: { id: job.interactionId },
          data: {
            processingStatus: ProcessingStatus.completed,
            processedAt: new Date(),
            transcription:
              typeof outputPayload.transcription === "string"
                ? outputPayload.transcription
                : null,
          },
        })
        break
      case AiJobType.extraction:
        await db.interaction.update({
          where: { id: job.interactionId },
          data: {
            processingStatus: ProcessingStatus.completed,
            processedAt: new Date(),
            aiSummary:
              typeof outputPayload.summary === "string" ? outputPayload.summary : null,
            aiSalesSuggestion:
              typeof outputPayload.salesSuggestion === "string"
                ? outputPayload.salesSuggestion
                : null,
            aiExtractedData:
              typeof outputPayload.extractedData === "object" &&
              outputPayload.extractedData !== null
                ? (outputPayload.extractedData as Record<string, unknown>)
                : {},
            aiConfidence:
              typeof outputPayload.confidence === "object" &&
              outputPayload.confidence !== null
                ? (outputPayload.confidence as Record<string, number>)
                : {},
            extractionVersion:
              typeof outputPayload.extractionVersion === "string"
                ? outputPayload.extractionVersion
                : null,
            modelName:
              typeof outputPayload.modelName === "string" ? outputPayload.modelName : null,
          },
        })
        break
      case AiJobType.ocr:
        await db.interaction.update({
          where: { id: job.interactionId },
          data: {
            processingStatus: ProcessingStatus.completed,
            processedAt: new Date(),
            transcription: typeof outputPayload.text === "string" ? outputPayload.text : null,
            aiSummary:
              typeof outputPayload.summary === "string" ? outputPayload.summary : null,
          },
        })
        break
      default:
        await db.interaction.update({
          where: { id: job.interactionId },
          data: {
            processingStatus: ProcessingStatus.completed,
            processedAt: new Date(),
          },
        })
        break
    }

    return job
  }

  async failJob(jobId: string, errorMessage: string) {
    const job = await db.aiJob.update({
      where: { id: jobId },
      data: {
        status: AiJobStatus.failed,
        errorMessage,
        finishedAt: new Date(),
      },
      include: {
        interaction: true,
      },
    })

    if (job.interactionId) {
      await db.interaction.update({
        where: { id: job.interactionId },
        data: {
          processingStatus: ProcessingStatus.failed,
          errorMessage,
        },
      })
    }

    return job
  }
}

export const aiJobService = new AiJobService()
