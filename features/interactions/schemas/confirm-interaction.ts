import { z } from "zod"

const optionalText = z.string().trim().min(1).max(255).optional()
const optionalLongText = z.string().trim().min(1).max(2000).optional()
const optionalEnum = (values: readonly [string, ...string[]]) => z.enum(values).optional()

export const confirmInteractionSchema = z.object({
  createNewCustomer: z.boolean().optional(),
  customerData: z
    .object({
      name: optionalText,
      phone: optionalText,
      city: optionalText,
      district: optionalText,
      age: z.number().int().min(0).max(130).optional(),
      gender: optionalText,
      interestLevel: optionalEnum(["high", "medium", "low", "unknown"]),
      budgetRange: optionalEnum([
        "below_5w",
        "between_5_10w",
        "between_10_16w",
        "above_16w",
        "unknown",
      ]),
      decisionStage: optionalEnum([
        "aware",
        "comparing",
        "visit_ready",
        "trial_ready",
        "move_ready",
        "unknown",
      ]),
      triggerReason: optionalLongText,
      healthCondition: optionalLongText,
      selfCareLevel: optionalEnum([
        "independent",
        "mostly_self",
        "partial_help",
        "dependent",
        "unknown",
      ]),
      careNeedLevel: optionalEnum(["none", "light", "medium", "heavy", "unknown"]),
      profileNotes: optionalLongText,
    })
    .optional(),
})

export type ConfirmInteractionInput = z.infer<typeof confirmInteractionSchema>
