import { db } from "@/lib/db"

export async function getInteraction(id: string) {
  return db.interaction.findUnique({
    where: { id },
    select: {
      id: true,
      customerId: true,
      ownerId: true,
      contactMethod: true,
      contentType: true,
      storageBucket: true,
      storagePath: true,
      mimeType: true,
      fileSizeBytes: true,
      durationSeconds: true,
      sourceText: true,
      transcription: true,
      processingStatus: true,
      errorMessage: true,
      processedAt: true,
      aiSummary: true,
      aiSalesSuggestion: true,
      aiExtractedData: true,
      aiConfidence: true,
      extractionVersion: true,
      modelName: true,
      confirmationStatus: true,
      confirmedAt: true,
      confirmedBy: true,
      createdAt: true,
      updatedAt: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          city: true,
          district: true,
          customerStatus: true,
          interestLevel: true,
          budgetRange: true,
          decisionStage: true,
        },
      },
      files: {
        select: {
          id: true,
          category: true,
          status: true,
          originalName: true,
          mimeType: true,
          fileSizeBytes: true,
          createdAt: true,
        },
      },
    },
  })
}
