import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { aiJobService } from "@/features/ai/server/ai-job-service"

const INTERNAL_API_TOKEN = process.env.CRM_INTERNAL_API_TOKEN

const startJobSchema = z.object({
  jobId: z.string().uuid(),
})

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!INTERNAL_API_TOKEN || token !== INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const input = startJobSchema.parse(body)
    const job = await aiJobService.getJob(input.jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.status === "completed" || job.status === "cancelled") {
      return NextResponse.json(
        {
          error: "Job is already finalized",
        },
        { status: 409 },
      )
    }

    if (job.status === "running") {
      return NextResponse.json({
        success: true,
        alreadyRunning: true,
        data: job,
      })
    }

    const startedJob = await aiJobService.markJobRunning(job.id)

    return NextResponse.json({
      success: true,
      alreadyRunning: false,
      data: startedJob,
    })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid start request.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message === "Job is already finalized") {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error("Failed to start AI job", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to start AI job.",
      },
      { status: 500 },
    )
  }
}
