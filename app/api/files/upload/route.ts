import { FileCategory, FileStatus } from "@/generated/prisma/client"
import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { db } from "@/lib/db"
import { storage } from "@/lib/storage"

const uploadMetaSchema = z.object({
  interactionId: z.string().uuid().optional(),
  customerId: z.string().uuid().optional(),
})

function getFileCategory(mimeType: string): FileCategory {
  if (mimeType.startsWith("audio/")) {
    return FileCategory.audio
  }
  if (mimeType.startsWith("image/")) {
    return FileCategory.image
  }
  return FileCategory.document
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get("file")
    const parsedMeta = uploadMetaSchema.parse({
      interactionId:
        typeof formData.get("interactionId") === "string"
          ? formData.get("interactionId")
          : undefined,
      customerId:
        typeof formData.get("customerId") === "string" ? formData.get("customerId") : undefined,
    })

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const category = getFileCategory(file.type)
    const buffer = Buffer.from(await file.arrayBuffer())

    const uploadResult = await storage.upload(
      {
        buffer,
        mimeType: file.type,
        originalName: file.name,
        size: file.size,
      },
      category === FileCategory.audio
        ? "audio"
        : category === FileCategory.image
          ? "image"
          : "document",
    )

    const fileRecord = await db.file.create({
      data: {
        interactionId: parsedMeta.interactionId ?? null,
        customerId: parsedMeta.customerId ?? null,
        category,
        status: FileStatus.uploaded,
        storageBucket: uploadResult.storageBucket,
        storagePath: uploadResult.storagePath,
        originalName: file.name,
        mimeType: file.type,
        fileSizeBytes: file.size,
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

    return NextResponse.json({ data: fileRecord }, { status: 201 })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid upload metadata.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (
      error instanceof Error &&
      (error.message.startsWith("Invalid ") || error.message.startsWith("File size exceeds"))
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 400 },
      )
    }

    console.error("File upload failed", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Upload failed",
      },
      { status: 500 },
    )
  }
}
