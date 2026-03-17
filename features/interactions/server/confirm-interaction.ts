import { ConfirmationStatus, ProcessingStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"

import { createCustomerFromInteraction } from "@/features/customers/server/create-customer"
import { updateCustomerFromConfirmation } from "@/features/customers/server/update-customer"

export interface ConfirmInteractionInput {
  confirmedBy: string
  customerData?: {
    name?: string
    phone?: string
    city?: string
    district?: string
    age?: number
    gender?: string
    interestLevel?: string
    budgetRange?: string
    decisionStage?: string
    triggerReason?: string
    healthCondition?: string
    selfCareLevel?: string
    careNeedLevel?: string
    profileNotes?: string
  }
  createNewCustomer?: boolean
}

export async function confirmInteraction(
  interactionId: string,
  input: ConfirmInteractionInput,
) {
  const interaction = await db.interaction.findUnique({
    where: { id: interactionId },
    include: { customer: true },
  })

  if (!interaction) {
    throw new Error("Interaction not found")
  }

  if (interaction.confirmationStatus === ConfirmationStatus.confirmed) {
    throw new Error("Interaction already confirmed")
  }

  if (interaction.processingStatus !== ProcessingStatus.completed) {
    throw new Error("Interaction is not ready for confirmation")
  }

  let customerId = interaction.customerId

  if (input.customerData) {
    if (input.createNewCustomer || !customerId) {
      const newCustomer = await createCustomerFromInteraction({
        ...input.customerData,
        ownerId: interaction.ownerId ?? undefined,
      })
      customerId = newCustomer.id
    } else if (customerId) {
      await updateCustomerFromConfirmation(customerId, input.customerData)
    }
  }

  const updatedInteraction = await db.interaction.update({
    where: { id: interactionId },
    data: {
      confirmationStatus: ConfirmationStatus.confirmed,
      confirmedAt: new Date(),
      confirmedBy: input.confirmedBy,
      customerId,
    },
    select: {
      id: true,
      customerId: true,
      confirmationStatus: true,
      confirmedAt: true,
      confirmedBy: true,
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
        },
      },
    },
  })

  if (customerId) {
    await db.customer.update({
      where: { id: customerId },
      data: { lastInteractionAt: new Date() },
    })
  }

  return updatedInteraction
}
