import { NextResponse } from "next/server"
import { ZodError } from "zod"

import { createInteraction } from "@/features/interactions/server/create-interaction"
import { createInteractionSchema } from "@/features/interactions/schemas/create-interaction"

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
