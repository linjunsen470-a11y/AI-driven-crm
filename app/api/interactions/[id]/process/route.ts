import { NextResponse } from "next/server"
import { ZodError, z } from "zod"

import { runMockAiJob } from "@/features/ai/server/mock-ai-worker"
import { requestInteractionProcessing } from "@/features/ai/server/request-interaction-processing"

const requestProcessingSchema = z.object({
  fileId: z.string().uuid().optional(),
  mode: z.enum(["enqueue", "mock"]).default("enqueue"),
})

interface RouteParams {
  params: { id: string }
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    if (!params.id) {
      return NextResponse.json({ error: "Interaction ID is required." }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const input = requestProcessingSchema.parse(body)

    const result = await requestInteractionProcessing({
      interactionId: params.id,
      fileId: input.fileId,
    })

    if (input.mode === "mock") {
      const mockResult = await runMockAiJob(result.job.id)
      return NextResponse.json(
        {
          data: {
            job: mockResult.job,
            reused: result.reused,
            executedBy: "mock",
          },
        },
        { status: 201 },
      )
    }

    return NextResponse.json(
      {
        data: result,
      },
      { status: result.reused ? 200 : 201 },
    )
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid processing request.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (
      error instanceof Error &&
      error.message === "Interaction not found"
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 },
      )
    }

    if (
      error instanceof Error &&
      [
        "Resolved interactions cannot be reprocessed",
        "Selected file does not belong to this interaction",
        "Selected file is not supported for AI processing",
        "Interaction has no processable content",
      ].includes(error.message)
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error("Failed to request interaction processing", error)

    return NextResponse.json(
      {
        error: "Failed to request interaction processing.",
      },
      { status: 500 },
    )
  }
}
