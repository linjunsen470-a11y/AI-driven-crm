import { ConfirmationStatus, ProcessingStatus } from "@/generated/prisma/client"
import { db } from "@/lib/db"

import { createCustomerFromInteraction } from "@/features/customers/server/create-customer"
import { updateCustomerFromConfirmation } from "@/features/customers/server/update-customer"

export interface ConfirmInteractionInput {
  confirmedBy: string
  confirmationStatus?: "confirmed" | "partially_confirmed" | "rejected"
  rejectionReason?: string
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

  if (interaction.confirmationStatus !== ConfirmationStatus.pending) {
    throw new Error("Interaction already handled")
  }

  if (interaction.processingStatus !== ProcessingStatus.completed) {
    throw new Error("Interaction is not ready for confirmation")
  }

  const targetStatus = (() => {
    switch (input.confirmationStatus) {
      case "rejected":
        return ConfirmationStatus.rejected
      case "partially_confirmed":
        return ConfirmationStatus.partially_confirmed
      case "confirmed":
      default:
        return ConfirmationStatus.confirmed
    }
  })()

  if (targetStatus === ConfirmationStatus.rejected) {
    return db.interaction.update({
      where: { id: interactionId },
      data: {
        confirmationStatus: ConfirmationStatus.rejected,
        confirmedAt: new Date(),
        confirmedBy: input.confirmedBy,
        errorMessage: input.rejectionReason ?? "Rejected by user",
      },
      select: {
        id: true,
        customerId: true,
        confirmationStatus: true,
        confirmedAt: true,
        confirmedBy: true,
        errorMessage: true,
      },
    })
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
      confirmationStatus: targetStatus,
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
