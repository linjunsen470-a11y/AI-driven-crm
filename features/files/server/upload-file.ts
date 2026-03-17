import { FileCategory, FileStatus } from "@/generated/prisma/client"

import { db } from "@/lib/db"
import { storage } from "@/lib/storage"

export interface UploadFileInput {
  interactionId?: string
  customerId?: string
  file: {
    buffer: Buffer
    mimeType: string
    originalName: string
    size: number
  }
}

function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith("audio/")) {
    return FileCategory.audio
  }

  if (mimeType.startsWith("image/")) {
    return FileCategory.image
  }

  return FileCategory.document
}

export async function uploadFile(input: UploadFileInput) {
  const category = getFileCategory(input.file.mimeType)

  const interaction = input.interactionId
    ? await db.interaction.findUnique({
        where: { id: input.interactionId },
        select: {
          id: true,
          customerId: true,
          ownerId: true,
        },
      })
    : null

  if (input.interactionId && !interaction) {
    throw new Error("Interaction not found")
  }

  const customer = input.customerId
    ? await db.customer.findUnique({
        where: { id: input.customerId },
        select: { id: true },
      })
    : null

  if (input.customerId && !customer) {
    throw new Error("Customer not found")
  }

  if (interaction?.customerId && input.customerId && interaction.customerId !== input.customerId) {
    throw new Error("Interaction and customer do not match")
  }

  const uploadResult = await storage.upload(
    input.file,
    category === FileCategory.audio
      ? "audio"
      : category === FileCategory.image
        ? "image"
        : "document",
  )

  return db.file.create({
    data: {
      ownerId: interaction?.ownerId ?? null,
      interactionId: input.interactionId ?? null,
      customerId: input.customerId ?? interaction?.customerId ?? null,
      category,
      status: FileStatus.uploaded,
      storageBucket: uploadResult.storageBucket,
      storagePath: uploadResult.storagePath,
      originalName: input.file.originalName,
      mimeType: input.file.mimeType,
      fileSizeBytes: input.file.size,
      sha256: uploadResult.sha256,
    },
    select: {
      id: true,
      category: true,
      status: true,
      originalName: true,
      mimeType: true,
      fileSizeBytes: true,
      createdAt: true,
    },
  })
}
