import { NextResponse } from "next/server"

import { getInteraction } from "@/features/interactions/server/get-interaction"

interface RouteParams {
  params: Promise<{ id: string }>
}

export async function GET(_request: Request, { params }: RouteParams) {
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

    const interaction = await getInteraction(id)

    if (!interaction) {
      return NextResponse.json(
        {
          error: "Interaction not found.",
        },
        { status: 404 },
      )
    }

    return NextResponse.json({ data: interaction })
  } catch (error) {
    console.error("Failed to get interaction", error)

    return NextResponse.json(
      {
        error: "Failed to get interaction.",
      },
      { status: 500 },
    )
  }
}
