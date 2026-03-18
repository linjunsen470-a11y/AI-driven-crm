import { Prisma } from "@/generated/prisma/client"
import { z } from "zod"

export interface ExtractedCustomerData {
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

export interface TranscriptionJobPayload {
  fileId: string
  fileCategory: "audio"
  storageBucket?: string | null
  storagePath?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
}

export interface OcrJobPayload {
  fileId: string
  fileCategory: "image"
  storageBucket?: string | null
  storagePath?: string | null
  originalName?: string | null
  mimeType?: string | null
  fileSizeBytes?: number | null
}

export interface ExtractionJobPayload {
  sourceText: string
}

export interface TranscriptionJobOutput {
  transcription: string
}

export interface OcrJobOutput {
  text: string
  summary: string
}

export interface ExtractionJobOutput {
  summary: string
  salesSuggestion: string
  extractedData: ExtractedCustomerData
  confidence: Record<string, number>
  extractionVersion: string
  modelName: string
}

export const jsonObjectSchema = z.record(z.string(), z.unknown())

export function toPrismaJsonObject(
  value: object | undefined | null,
): Prisma.InputJsonObject {
  if (!value) {
    return {}
  }

  const result: Record<string, Prisma.InputJsonValue | null> = {}

  for (const [key, entryValue] of Object.entries(value as Record<string, unknown>)) {
    if (entryValue === undefined) {
      continue
    }

    if (entryValue === null) {
      result[key] = null
      continue
    }

    result[key] = toPrismaJsonFieldValue(entryValue)
  }

  return result as Prisma.InputJsonObject
}

function toPrismaJsonFieldValue(value: unknown): Prisma.InputJsonValue | null {
  if (value === null) {
    return null
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return value
  }

  if (Array.isArray(value)) {
    return value.map((item) =>
      item === null ? null : toPrismaJsonFieldValue(item),
    ) as Prisma.InputJsonArray
  }

  if (typeof value === "object") {
    return toPrismaJsonObject(value)
  }

  throw new Error("Unsupported JSON value")
}
