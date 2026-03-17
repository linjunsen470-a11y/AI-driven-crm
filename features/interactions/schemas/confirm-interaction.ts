import { z } from "zod"

const optionalText = z.string().trim().min(1).max(255).optional()
const optionalLongText = z.string().trim().min(1).max(2000).optional()
const optionalEnum = (values: readonly [string, ...string[]]) => z.enum(values).optional()
const optionalRejectionReason = z.string().trim().min(1).max(500).optional()

export const confirmationStatusSchema = z.enum([
  "confirmed",
  "partially_confirmed",
  "rejected",
])

export const confirmInteractionSchema = z
  .object({
    confirmationStatus: confirmationStatusSchema.default("confirmed"),
    rejectionReason: optionalRejectionReason,
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
  .superRefine((value, ctx) => {
    if (value.confirmationStatus === "rejected" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejection reason is required when rejecting an interaction.",
        path: ["rejectionReason"],
      })
    }
  })

export type ConfirmInteractionInput = z.infer<typeof confirmInteractionSchema>
