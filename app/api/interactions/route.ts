import { NextResponse } from "next/server"
import { ZodError } from "zod"
import { ConfirmationStatus, ProcessingStatus } from "@/generated/prisma/client"

import { createInteraction } from "@/features/interactions/server/create-interaction"
import { createInteractionSchema } from "@/features/interactions/schemas/create-interaction"
import { getInteractions } from "@/features/interactions/server/get-interactions"

const confirmationStatuses = new Set(Object.values(ConfirmationStatus))
const processingStatuses = new Set(Object.values(ProcessingStatus))

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const confirmationStatusParam = searchParams.get("confirmationStatus")
    const processingStatusParam = searchParams.get("processingStatus")
    const limitParam = searchParams.get("limit")
    const offsetParam = searchParams.get("offset")

    const confirmationStatus =
      confirmationStatusParam && confirmationStatuses.has(confirmationStatusParam as ConfirmationStatus)
        ? (confirmationStatusParam as ConfirmationStatus)
        : undefined

    const processingStatus =
      processingStatusParam && processingStatuses.has(processingStatusParam as ProcessingStatus)
        ? (processingStatusParam as ProcessingStatus)
        : undefined

    const limit = limitParam ? Number.parseInt(limitParam, 10) : 50
    const offset = offsetParam ? Number.parseInt(offsetParam, 10) : 0

    const result = await getInteractions({
      confirmationStatus,
      processingStatus,
      customerId: searchParams.get("customerId") || undefined,
      ownerId: searchParams.get("ownerId") || undefined,
      limit: Number.isNaN(limit) ? 50 : limit,
      offset: Number.isNaN(offset) ? 0 : offset,
    })

    return NextResponse.json({ data: result })
  } catch (error) {
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
