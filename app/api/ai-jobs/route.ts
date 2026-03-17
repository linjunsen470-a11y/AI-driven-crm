import { AiJobType } from "@/generated/prisma/client"
import { NextResponse } from "next/server"
import { z } from "zod"

import { aiJobService } from "@/features/ai/server/ai-job-service"

const createJobSchema = z.object({
  jobType: z.enum([
    "transcription",
    "ocr",
    "summary",
    "extraction",
    "knowledge_ingestion",
    "reminder_generation",
    "chat_response",
    "call_import",
    "other",
  ]),
  interactionId: z.string().uuid().optional(),
  knowledgeDocumentId: z.string().uuid().optional(),
  inputPayload: z.record(z.unknown()).optional(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const result = createJobSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { jobType, interactionId, knowledgeDocumentId, inputPayload } = result.data

    const job = await aiJobService.createJob({
      jobType: jobType as AiJobType,
      interactionId,
      knowledgeDocumentId,
      inputPayload,
    })

    return NextResponse.json({ data: job }, { status: 201 })
  } catch (error) {
    console.error("Failed to create AI job", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create job",
      },
      { status: 500 },
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const limit = Number.parseInt(searchParams.get("limit") || "10", 10)

    const jobs = status === "pending" ? await aiJobService.getPendingJobs(limit) : []

    return NextResponse.json({ data: jobs })
  } catch (error) {
    console.error("Failed to list AI jobs", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list jobs",
      },
      { status: 500 },
    )
  }
}
