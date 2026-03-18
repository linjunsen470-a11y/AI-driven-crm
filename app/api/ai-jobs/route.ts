import { AiJobType } from "@/generated/prisma/client"
import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { jsonObjectSchema } from "@/features/ai/server/ai-job-contracts"
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
  inputPayload: jsonObjectSchema.optional(),
})

const listJobsQuerySchema = z.object({
  status: z.enum(["queued", "running", "completed", "failed", "cancelled"]).optional(),
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
  interactionId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
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
    const query = listJobsQuerySchema.parse({
      status: searchParams.get("status") || undefined,
      jobType: searchParams.get("jobType") || undefined,
      interactionId: searchParams.get("interactionId") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    })

    const jobs = await aiJobService.listJobs({
      status: query.status,
      jobType: query.jobType as AiJobType | undefined,
      interactionId: query.interactionId,
      limit: query.limit,
      offset: query.offset,
    })

    return NextResponse.json({ data: jobs })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid AI job query.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    console.error("Failed to list AI jobs", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to list jobs",
      },
      { status: 500 },
    )
  }
}
