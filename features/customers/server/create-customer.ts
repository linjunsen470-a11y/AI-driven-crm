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

function parseEnumValue<T extends Record<string, string>>(
  value: string | undefined,
  enumObject: T,
): T[keyof T] | undefined {
  if (!value) {
    return undefined
  }

  return (enumObject as Record<string, T[keyof T]>)[value]
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
      interestLevel: parseEnumValue(input.interestLevel, InterestLevel),
      budgetRange: parseEnumValue(input.budgetRange, BudgetRange),
      decisionStage: parseEnumValue(input.decisionStage, DecisionStage),
      triggerReason: input.triggerReason ?? null,
      healthCondition: input.healthCondition ?? null,
      selfCareLevel: parseEnumValue(input.selfCareLevel, SelfCareLevel),
      careNeedLevel: parseEnumValue(input.careNeedLevel, CareNeedLevel),
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
