import {
  BudgetRange,
  CareNeedLevel,
  DecisionStage,
  InterestLevel,
  SelfCareLevel,
} from "@/generated/prisma/client"
import { db } from "@/lib/db"

export interface UpdateCustomerInput {
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

function parseEnumValue<T extends Record<string, string>>(
  value: string | undefined,
  enumObject: T,
): T[keyof T] | undefined {
  if (!value) {
    return undefined
  }

  return (enumObject as Record<string, T[keyof T]>)[value]
}

export async function updateCustomerFromConfirmation(
  customerId: string,
  input: UpdateCustomerInput,
) {
  const phoneNormalized = input.phone?.replace(/\s+/g, "").replace(/[-()]/g, "")
  const updateData: Record<string, unknown> = {}

  if (input.name !== undefined) updateData.name = input.name ?? null
  if (input.phone !== undefined) {
    updateData.phone = input.phone ?? null
    updateData.phoneNormalized = phoneNormalized ?? null
  }
  if (input.city !== undefined) updateData.city = input.city ?? null
  if (input.district !== undefined) updateData.district = input.district ?? null
  if (input.age !== undefined) updateData.age = input.age ?? null
  if (input.gender !== undefined) updateData.gender = input.gender ?? null
  if (input.interestLevel !== undefined) {
    updateData.interestLevel = parseEnumValue(input.interestLevel, InterestLevel)
  }
  if (input.budgetRange !== undefined) {
    updateData.budgetRange = parseEnumValue(input.budgetRange, BudgetRange)
  }
  if (input.decisionStage !== undefined) {
    updateData.decisionStage = parseEnumValue(input.decisionStage, DecisionStage)
  }
  if (input.triggerReason !== undefined) updateData.triggerReason = input.triggerReason ?? null
  if (input.healthCondition !== undefined) updateData.healthCondition = input.healthCondition ?? null
  if (input.selfCareLevel !== undefined) {
    updateData.selfCareLevel = parseEnumValue(input.selfCareLevel, SelfCareLevel)
  }
  if (input.careNeedLevel !== undefined) {
    updateData.careNeedLevel = parseEnumValue(input.careNeedLevel, CareNeedLevel)
  }
  if (input.profileNotes !== undefined) updateData.profileNotes = input.profileNotes ?? null

  return db.customer.update({
    where: { id: customerId },
    data: updateData,
    select: {
      id: true,
      name: true,
      phone: true,
      customerStatus: true,
      updatedAt: true,
    },
  })
}
