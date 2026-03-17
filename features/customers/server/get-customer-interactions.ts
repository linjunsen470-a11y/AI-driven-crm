import { db } from "@/lib/db"

export async function getCustomerInteractions(customerId: string, limit = 50, offset = 0) {
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safeOffset = Math.max(offset, 0)

  const [interactions, total] = await Promise.all([
    db.interaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "desc" },
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        contactMethod: true,
        contentType: true,
        processingStatus: true,
        confirmationStatus: true,
        sourceText: true,
        transcription: true,
        aiSummary: true,
        aiSalesSuggestion: true,
        createdAt: true,
        confirmedAt: true,
        files: {
          select: {
            id: true,
            category: true,
            status: true,
            originalName: true,
            mimeType: true,
            fileSizeBytes: true,
          },
        },
      },
    }),
    db.interaction.count({ where: { customerId } }),
  ])

  return { interactions, total, limit: safeLimit, offset: safeOffset }
}
