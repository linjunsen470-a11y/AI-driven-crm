import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { dispatchAiJob } from "@/features/ai/server/ai-job-dispatcher"

const INTERNAL_API_TOKEN = process.env.CRM_INTERNAL_API_TOKEN

const dispatchJobSchema = z.object({
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
    const input = dispatchJobSchema.parse(body)
    const result = await dispatchAiJob(input.jobId)

    const statusCode =
      result.status === "dispatched" ? 202 : result.status === "failed" ? 502 : 200

    return NextResponse.json(
      {
        success: result.status !== "failed",
        data: result,
      },
      { status: statusCode },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid dispatch request.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message === "Job not found") {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 },
      )
    }

    console.error("Failed to dispatch AI job", error)

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to dispatch AI job.",
      },
      { status: 500 },
    )
  }
}
