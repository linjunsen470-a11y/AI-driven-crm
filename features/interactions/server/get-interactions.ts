import { ConfirmationStatus, Prisma, ProcessingStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"

export interface ListInteractionsFilters {
  confirmationStatus?: ConfirmationStatus
  processingStatus?: ProcessingStatus
  customerId?: string
  ownerId?: string
  limit?: number
  offset?: number
}

export async function getInteractions(filters: ListInteractionsFilters = {}) {
  const {
    confirmationStatus,
    processingStatus,
    customerId,
    ownerId,
    limit = 50,
    offset = 0,
  } = filters

  const where: Prisma.InteractionWhereInput = {}
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safeOffset = Math.max(offset, 0)

  if (confirmationStatus) {
    where.confirmationStatus = confirmationStatus
  }
  if (processingStatus) {
    where.processingStatus = processingStatus
  }
  if (customerId) {
    where.customerId = customerId
  }
  if (ownerId) {
    where.ownerId = ownerId
  }

  const [interactions, total] = await Promise.all([
    db.interaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        customerId: true,
        ownerId: true,
        contactMethod: true,
        contentType: true,
        processingStatus: true,
        confirmationStatus: true,
        sourceText: true,
        transcription: true,
        aiSummary: true,
        createdAt: true,
        updatedAt: true,
        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    }),
    db.interaction.count({ where }),
  ])

  return { interactions, total, limit: safeLimit, offset: safeOffset }
}

export async function getPendingInteractions(limit = 50, offset = 0) {
  return getInteractions({
    confirmationStatus: ConfirmationStatus.pending,
    limit,
    offset,
  })
}
