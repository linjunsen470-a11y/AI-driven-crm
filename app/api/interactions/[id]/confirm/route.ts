import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { getMockCurrentUser } from "@/lib/auth/mock-user"
import { confirmInteraction } from "@/features/interactions/server/confirm-interaction"
import { confirmInteractionSchema } from "@/features/interactions/schemas/confirm-interaction"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function POST(request: Request, { params }: RouteParams) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json(
        {
          error: "Interaction ID is required.",
        },
        { status: 400 },
      )
    }

    const body = await request.json()
    const input = confirmInteractionSchema.parse(body)
    const currentUser = getMockCurrentUser()

    const result = await confirmInteraction(id, {
      confirmedBy: currentUser.id,
      confirmationStatus: input.confirmationStatus,
      rejectionReason: input.rejectionReason,
      customerData: input.customerData,
      createNewCustomer: input.createNewCustomer,
    })

    return NextResponse.json({ data: result })
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
          error: "Invalid confirmation payload.",
          details: error.flatten(),
        },
        { status: 400 },
      )
    }

    if (error instanceof Error && error.message === "Interaction not found") {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 404 },
      )
    }

    if (error instanceof Error && error.message === "Interaction is not ready for confirmation") {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    if (
      error instanceof Error &&
      (error.message === "Interaction already confirmed" ||
        error.message === "Interaction already handled")
    ) {
      return NextResponse.json(
        {
          error: error.message,
        },
        { status: 409 },
      )
    }

    console.error("Failed to confirm interaction", error)

    return NextResponse.json(
      {
        error: "Failed to confirm interaction.",
      },
      { status: 500 },
    )
  }
}
