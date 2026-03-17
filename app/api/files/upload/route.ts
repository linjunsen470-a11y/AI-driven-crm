import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { uploadFile } from "@/features/files/server/upload-file"

const uploadMetaSchema = z
  .object({
    interactionId: z.string().uuid().optional(),
    customerId: z.string().uuid().optional(),
  })
  .refine((value) => Boolean(value.interactionId || value.customerId), {
    message: "Either interactionId or customerId is required.",
    path: ["interactionId"],
  })

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

    const fileRecord = await uploadFile({
      interactionId: parsedMeta.interactionId,
      customerId: parsedMeta.customerId,
      file: {
        buffer: Buffer.from(await file.arrayBuffer()),
        mimeType: file.type,
        originalName: file.name,
        size: file.size,
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
      (error.message.startsWith("Invalid ") ||
        error.message.startsWith("File size exceeds") ||
        error.message === "Interaction not found" ||
        error.message === "Customer not found" ||
        error.message === "Interaction and customer do not match")
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
