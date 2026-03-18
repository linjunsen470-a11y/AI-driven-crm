import { db } from "@/lib/db"

import { toPrismaJsonObject } from "@/features/ai/server/ai-job-contracts"
import {
  extractCustomerDataFromText,
  TEXT_EXTRACTION_MODEL_NAME,
  TEXT_EXTRACTION_VERSION,
} from "@/features/ai/server/extract-customer-data"
import type { CreateInteractionInput } from "@/features/interactions/schemas/create-interaction"

export async function createInteraction(input: CreateInteractionInput) {
  const now = new Date()
  const isTextInteraction = input.contentType === "text" && Boolean(input.sourceText)
  const extraction = isTextInteraction
    ? await extractCustomerDataFromText(input.sourceText ?? "")
    : null

  const interaction = await db.interaction.create({
    data: {
      ownerId: input.ownerId ?? null,
      customerId: input.customerId ?? null,
      contactMethod: input.contactMethod,
      contentType: input.contentType,
      storageBucket: input.storageBucket ?? null,
      storagePath: input.storagePath ?? null,
      mimeType: input.mimeType ?? null,
      fileSizeBytes: input.fileSizeBytes ?? null,
      durationSeconds: input.durationSeconds ?? null,
      sourceText: input.sourceText ?? null,
      processingStatus: isTextInteraction ? "completed" : "pending",
      processedAt: isTextInteraction ? now : null,
      aiSummary: extraction?.summary ?? null,
      aiSalesSuggestion: extraction?.salesSuggestion ?? null,
      aiExtractedData: toPrismaJsonObject(extraction?.extractedData),
      aiConfidence: toPrismaJsonObject(extraction?.confidence),
      extractionVersion: extraction ? TEXT_EXTRACTION_VERSION : null,
      modelName: extraction ? TEXT_EXTRACTION_MODEL_NAME : null,
      confirmationStatus: "pending",
    },
    select: {
      id: true,
      customerId: true,
      ownerId: true,
      contactMethod: true,
      contentType: true,
      processingStatus: true,
      confirmationStatus: true,
      createdAt: true,
    },
  })

  return interaction
}
