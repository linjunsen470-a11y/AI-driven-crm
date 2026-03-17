import { AiJobType } from "@/generated/prisma/client"
import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { aiJobService } from "@/features/ai/server/ai-job-service"

const INTERNAL_API_TOKEN = process.env.CRM_INTERNAL_API_TOKEN

const claimJobSchema = z.object({
  jobType: z
    .enum([
      "transcription",
      "ocr",
      "summary",
      "extraction",
      "knowledge_ingestion",
      "reminder_generation",
      "chat_response",
      "call_import",
      "other",
    ])
    .optional(),
})

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!INTERNAL_API_TOKEN || token !== INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const input = claimJobSchema.parse(body)
    const job = await aiJobService.claimNextJob(input.jobType as AiJobType | undefined)

    return NextResponse.json({
      data: job,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid claim request.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    console.error("Failed to claim AI job", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to claim AI job.",
      },
      { status: 500 },
    )
  }
}
