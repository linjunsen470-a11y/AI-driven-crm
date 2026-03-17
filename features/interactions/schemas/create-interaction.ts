import { z } from "zod"

export const contactMethodSchema = z.enum(["phone", "wechat", "in_person", "other"])
export const contentTypeSchema = z.enum(["audio", "image", "text"])

export const createInteractionSchema = z
  .object({
    ownerId: z.uuid().optional().nullable(),
    customerId: z.uuid().optional().nullable(),
    contactMethod: contactMethodSchema,
    contentType: contentTypeSchema,
    storageBucket: z.string().max(100).optional().nullable(),
    storagePath: z.string().min(1).max(500).optional().nullable(),
    mimeType: z.string().max(100).optional().nullable(),
    fileSizeBytes: z.number().int().nonnegative().optional().nullable(),
    durationSeconds: z.number().int().nonnegative().optional().nullable(),
    sourceText: z.string().trim().min(1).max(20000).optional().nullable(),
  })
  .superRefine((value, ctx) => {
    if (value.contentType === "text" && !value.sourceText) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["sourceText"],
        message: "Text interactions require sourceText.",
      })
    }

    if (value.contentType !== "text" && !value.storagePath) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["storagePath"],
        message: "Audio and image interactions require storagePath.",
      })
    }
  })

export type CreateInteractionInput = z.infer<typeof createInteractionSchema>
