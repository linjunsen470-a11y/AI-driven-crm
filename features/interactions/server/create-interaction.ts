import { db } from "@/lib/db"

import type { CreateInteractionInput } from "@/features/interactions/schemas/create-interaction"

export async function createInteraction(input: CreateInteractionInput) {
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
      processingStatus: "pending",
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
