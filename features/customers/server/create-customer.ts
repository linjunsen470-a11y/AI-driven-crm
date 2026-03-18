import {
  BudgetRange,
  CareNeedLevel,
  CustomerStatus,
  DecisionStage,
  InterestLevel,
  SelfCareLevel,
} from "@/generated/prisma/client"
import { db } from "@/lib/db"

export interface CreateCustomerInput {
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
  ownerId?: string
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

export async function createCustomerFromInteraction(input: CreateCustomerInput) {
  const phoneNormalized = input.phone?.replace(/\s+/g, "").replace(/[-()]/g, "")

  return db.customer.create({
    data: {
      name: input.name ?? null,
      phone: input.phone ?? null,
      phoneNormalized: phoneNormalized ?? null,
      city: input.city ?? null,
      district: input.district ?? null,
      age: input.age ?? null,
      gender: input.gender ?? null,
      customerStatus: CustomerStatus.lead,
      interestLevel: parseEnumValue(input.interestLevel, interestLevels),
      budgetRange: parseEnumValue(input.budgetRange, budgetRanges),
      decisionStage: parseEnumValue(input.decisionStage, decisionStages),
      triggerReason: input.triggerReason ?? null,
      healthCondition: input.healthCondition ?? null,
      selfCareLevel: parseEnumValue(input.selfCareLevel, selfCareLevels),
      careNeedLevel: parseEnumValue(input.careNeedLevel, careNeedLevels),
      profileNotes: input.profileNotes ?? null,
      ownerId: input.ownerId ?? null,
      lastInteractionAt: new Date(),
    },
    select: {
      id: true,
      name: true,
      phone: true,
      customerStatus: true,
      createdAt: true,
    },
  })
}
