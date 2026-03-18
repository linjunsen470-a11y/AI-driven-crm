import { NextResponse } from "next/server"
import { z } from "zod"

import { jsonObjectSchema } from "@/features/ai/server/ai-job-contracts"
import { aiJobService } from "@/features/ai/server/ai-job-service"

const callbackSchema = z.object({
  jobId: z.string().uuid(),
  status: z.enum(["completed", "failed"]),
  output: jsonObjectSchema.optional(),
  error: z.string().optional(),
})

const INTERNAL_API_TOKEN = process.env.CRM_INTERNAL_API_TOKEN

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    const token = authHeader?.replace("Bearer ", "")

    if (!INTERNAL_API_TOKEN || token !== INTERNAL_API_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const result = callbackSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        {
          error: "Invalid payload",
          details: result.error.flatten(),
        },
        { status: 400 },
      )
    }

    const { jobId, status, output, error } = result.data
    const job = await aiJobService.getJob(jobId)

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    if (job.status === "completed" || job.status === "failed" || job.status === "cancelled") {
      return NextResponse.json({
        success: true,
        alreadyFinalized: true,
        data: {
          id: job.id,
          status: job.status,
        },
      })
    }

    if (status === "completed") {
      await aiJobService.completeJob(jobId, output ?? {})
    } else {
      await aiJobService.failJob(jobId, error ?? "Unknown error")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("AI job callback failed", error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Callback failed",
      },
      { status: 500 },
    )
  }
}
