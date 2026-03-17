import { db } from "@/lib/db"

import { extractCustomerDataFromText } from "@/features/ai/server/extract-customer-data"
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
      aiExtractedData: extraction?.extractedData ?? {},
      aiConfidence: extraction?.confidence ?? {},
      extractionVersion: extraction ? "placeholder-rule-based-v1" : null,
      modelName: extraction ? "rule-based-extractor" : null,
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
