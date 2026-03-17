import {
  AiJobStatus,
  AiJobType,
  ConfirmationStatus,
  FileCategory,
  FileStatus,
} from "@/generated/prisma/client"

import { db } from "@/lib/db"

import { aiJobService } from "@/features/ai/server/ai-job-service"

interface RequestInteractionProcessingInput {
  interactionId: string
  fileId?: string
}

function resolveJobType(category: FileCategory) {
  switch (category) {
    case FileCategory.audio:
      return AiJobType.transcription
    case FileCategory.image:
      return AiJobType.ocr
    default:
      return null
  }
}

export async function requestInteractionProcessing(
  input: RequestInteractionProcessingInput,
) {
  const interaction = await db.interaction.findUnique({
    where: { id: input.interactionId },
    select: {
      id: true,
      ownerId: true,
      sourceText: true,
      confirmationStatus: true,
      files: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          category: true,
          status: true,
          storageBucket: true,
          storagePath: true,
          originalName: true,
          mimeType: true,
          fileSizeBytes: true,
        },
      },
      aiJobs: {
        where: {
          status: {
            in: [AiJobStatus.queued, AiJobStatus.running],
          },
        },
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          jobType: true,
          status: true,
          interactionId: true,
          inputPayload: true,
          retryCount: true,
          createdAt: true,
        },
      },
    },
  })

  if (!interaction) {
    throw new Error("Interaction not found")
  }

  if (interaction.confirmationStatus !== ConfirmationStatus.pending) {
    throw new Error("Resolved interactions cannot be reprocessed")
  }

  const selectedFile = input.fileId
    ? interaction.files.find((file) => file.id === input.fileId)
    : interaction.files.find((file) =>
        [FileCategory.audio, FileCategory.image].includes(file.category),
      )

  if (input.fileId && !selectedFile) {
    throw new Error("Selected file does not belong to this interaction")
  }

  if (selectedFile) {
    const jobType = resolveJobType(selectedFile.category)

    if (!jobType) {
      throw new Error("Selected file is not supported for AI processing")
    }

    const existingJob = interaction.aiJobs.find((job) => {
      const payload =
        typeof job.inputPayload === "object" && job.inputPayload !== null
          ? (job.inputPayload as Record<string, unknown>)
          : {}

      return job.jobType === jobType && payload.fileId === selectedFile.id
    })

    if (existingJob) {
      return {
        job: existingJob,
        reused: true,
      }
    }

    const job = await aiJobService.createJob({
      jobType,
      interactionId: interaction.id,
      ownerId: interaction.ownerId ?? undefined,
      inputPayload: {
        fileId: selectedFile.id,
        fileCategory: selectedFile.category,
        storageBucket: selectedFile.storageBucket,
        storagePath: selectedFile.storagePath,
        originalName: selectedFile.originalName,
        mimeType: selectedFile.mimeType,
        fileSizeBytes: selectedFile.fileSizeBytes,
      },
    })

    await db.file.update({
      where: { id: selectedFile.id },
      data: {
        status: FileStatus.processing,
      },
    })

    return { job, reused: false }
  }

  if (!interaction.sourceText) {
    throw new Error("Interaction has no processable content")
  }

  const existingExtractionJob = interaction.aiJobs.find(
    (job) => job.jobType === AiJobType.extraction,
  )

  if (existingExtractionJob) {
    return {
      job: existingExtractionJob,
      reused: true,
    }
  }

  const job = await aiJobService.createJob({
    jobType: AiJobType.extraction,
    interactionId: interaction.id,
    ownerId: interaction.ownerId ?? undefined,
    inputPayload: {
      sourceText: interaction.sourceText,
    },
  })

  return { job, reused: false }
}
