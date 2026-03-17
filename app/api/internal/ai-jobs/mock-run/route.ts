import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { runMockAiJob } from "@/features/ai/server/mock-ai-worker"
import { aiJobService } from "@/features/ai/server/ai-job-service"

const INTERNAL_API_TOKEN = process.env.CRM_INTERNAL_API_TOKEN

const mockRunSchema = z.object({
  jobId: z.string().uuid().optional(),
})

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!INTERNAL_API_TOKEN || token !== INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const input = mockRunSchema.parse(body)

    const job = input.jobId ? await aiJobService.getJob(input.jobId) : await aiJobService.claimNextJob()

    if (!job) {
      return NextResponse.json({ data: null })
    }

    const result = await runMockAiJob(job.id)

    return NextResponse.json({
      data: result,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid mock run request.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (
      error instanceof Error &&
      (error.message === "Job not found" || error.message === "Job is already finalized")
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error("Failed to mock run AI job", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to mock run AI job.",
      },
      { status: 500 },
    )
  }
}
