import { CustomerStatus, InterestLevel, Prisma } from "@/generated/prisma/client"

import { db } from "@/lib/db"

export interface ListCustomersFilters {
  status?: CustomerStatus
  interestLevel?: InterestLevel
  search?: string
  ownerId?: string
  limit?: number
  offset?: number
}

export async function getCustomers(filters: ListCustomersFilters = {}) {
  const { status, interestLevel, search, ownerId, limit = 50, offset = 0 } = filters
  const safeLimit = Math.min(Math.max(limit, 1), 100)
  const safeOffset = Math.max(offset, 0)

  const where: Prisma.CustomerWhereInput = {}

  if (status) {
    where.customerStatus = status
  }

  if (interestLevel) {
    where.interestLevel = interestLevel
  }

  if (ownerId) {
    where.ownerId = ownerId
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { phone: { contains: search } },
      { city: { contains: search, mode: "insensitive" } },
      { district: { contains: search, mode: "insensitive" } },
    ]
  }

  const [customers, total] = await Promise.all([
    db.customer.findMany({
      where,
      orderBy: [{ lastInteractionAt: "desc" }, { createdAt: "desc" }],
      take: safeLimit,
      skip: safeOffset,
      select: {
        id: true,
        name: true,
        phone: true,
        city: true,
        district: true,
        age: true,
        gender: true,
        customerStatus: true,
        interestLevel: true,
        budgetRange: true,
        decisionStage: true,
        lastInteractionAt: true,
        createdAt: true,
        _count: {
          select: {
            interactions: true,
          },
        },
      },
    }),
    db.customer.count({ where }),
  ])

  return { customers, total, limit: safeLimit, offset: safeOffset }
}

export async function getCustomerById(id: string) {
  return db.customer.findUnique({
    where: { id },
    select: {
      id: true,
      ownerId: true,
      name: true,
      phone: true,
      phoneNormalized: true,
      city: true,
      district: true,
      gender: true,
      age: true,
      ageEstimated: true,
      customerStatus: true,
      retirementStatus: true,
      preRetirementOccupation: true,
      occupationCategory: true,
      pensionRange: true,
      paymentSource: true,
      maritalStatus: true,
      livingWithSpouse: true,
      housingStatus: true,
      livingArrangement: true,
      acceptsRelocation: true,
      livesAlone: true,
      homeownership: true,
      childrenCount: true,
      childrenLocations: true,
      childrenSupportLevel: true,
      childrenFinancialSupport: true,
      decisionMaker: true,
      interestScore: true,
      interestLevel: true,
      budgetRange: true,
      decisionStage: true,
      triggerReason: true,
      similarProjectAwareness: true,
      similarProjectNotes: true,
      annualStayPreference: true,
      annualStayDurationText: true,
      visitIntention: true,
      visitTimeText: true,
      visitDate: true,
      checkinIntention: true,
      checkinTimeText: true,
      checkinDate: true,
      healthCondition: true,
      selfCareLevel: true,
      careNeedLevel: true,
      livingRiskFlags: true,
      primaryNeeds: true,
      tags: true,
      profileNotes: true,
      lastInteractionAt: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}
