import { NextResponse } from "next/server"
import { ConfirmationStatus, ProcessingStatus } from "@/generated/prisma/client"
import { ZodError, z } from "zod"

import { createInteraction } from "@/features/interactions/server/create-interaction"
import { createInteractionSchema } from "@/features/interactions/schemas/create-interaction"
import { getInteractions } from "@/features/interactions/server/get-interactions"

const confirmationStatuses = new Set(Object.values(ConfirmationStatus))
const processingStatuses = new Set(Object.values(ProcessingStatus))

const listInteractionsQuerySchema = z.object({
  confirmationStatus: z
    .enum(["pending", "confirmed", "rejected", "partially_confirmed"])
    .optional(),
  processingStatus: z.enum(["pending", "processing", "completed", "failed"]).optional(),
  customerId: z.string().uuid().optional(),
  ownerId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const query = listInteractionsQuerySchema.parse({
      confirmationStatus: searchParams.get("confirmationStatus") || undefined,
      processingStatus: searchParams.get("processingStatus") || undefined,
      customerId: searchParams.get("customerId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      limit: searchParams.get("limit") || undefined,
      offset: searchParams.get("offset") || undefined,
    })

    const result = await getInteractions({
      confirmationStatus:
        query.confirmationStatus && confirmationStatuses.has(query.confirmationStatus)
          ? (query.confirmationStatus as ConfirmationStatus)
          : undefined,
      processingStatus:
        query.processingStatus && processingStatuses.has(query.processingStatus)
          ? (query.processingStatus as ProcessingStatus)
          : undefined,
      customerId: query.customerId,
      ownerId: query.ownerId,
      limit: query.limit,
      offset: query.offset,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid interaction query.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    console.error("Failed to list interactions", error)

    return NextResponse.json(
      {
        error: "Failed to list interactions.",
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const input = createInteractionSchema.parse(body)
    const interaction = await createInteraction(input)

    return NextResponse.json(
      {
        data: interaction,
      },
      { status: 201 },
    )
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        {
          error: "Invalid JSON body.",
        },
        { status: 400 },
      )
    }

    if (error instanceof ZodError) {
      return NextResponse.json(
        {
          error: "Invalid interaction payload.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    console.error("Failed to create interaction", error)

    return NextResponse.json(
      {
        error: "Failed to create interaction.",
      },
      { status: 500 },
    )
  }
}
