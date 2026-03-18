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

const interestLevels = Object.values(InterestLevel)
const budgetRanges = Object.values(BudgetRange)
const decisionStages = Object.values(DecisionStage)
const selfCareLevels = Object.values(SelfCareLevel)
const careNeedLevels = Object.values(CareNeedLevel)

function parseEnumValue<T extends string>(
  value: string | undefined,
  allowedValues: readonly T[],
): T | undefined {
  if (!value || !allowedValues.includes(value as T)) {
    return undefined
  }

  return value as T
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
    updateData.interestLevel = parseEnumValue(input.interestLevel, interestLevels)
  }
  if (input.budgetRange !== undefined) {
    updateData.budgetRange = parseEnumValue(input.budgetRange, budgetRanges)
  }
  if (input.decisionStage !== undefined) {
    updateData.decisionStage = parseEnumValue(input.decisionStage, decisionStages)
  }
  if (input.triggerReason !== undefined) updateData.triggerReason = input.triggerReason ?? null
  if (input.healthCondition !== undefined) updateData.healthCondition = input.healthCondition ?? null
  if (input.selfCareLevel !== undefined) {
    updateData.selfCareLevel = parseEnumValue(input.selfCareLevel, selfCareLevels)
  }
  if (input.careNeedLevel !== undefined) {
    updateData.careNeedLevel = parseEnumValue(input.careNeedLevel, careNeedLevels)
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
