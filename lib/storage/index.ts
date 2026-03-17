import { createHash } from "crypto"
import { existsSync } from "fs"
import { mkdir, readFile, writeFile } from "fs/promises"
import path from "path"

export interface StorageConfig {
  driver: "local" | "s3" | "minio"
  localRoot?: string
  bucket?: string
  s3Endpoint?: string
  s3Region?: string
  s3AccessKey?: string
  s3SecretKey?: string
  s3ForcePathStyle?: boolean
}

export interface UploadResult {
  storageBucket: string
  storagePath: string
  sha256: string
  size: number
}

export interface StorageFile {
  buffer: Buffer
  mimeType: string
  originalName: string
  size: number
}

const DEFAULT_ALLOWED_AUDIO_TYPES = [
  "audio/wav",
  "audio/mpeg",
  "audio/mp4",
  "audio/x-m4a",
  "audio/webm",
]

const DEFAULT_ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
]

export class StorageService {
  private readonly config: StorageConfig
  private readonly allowedAudioTypes: string[]
  private readonly allowedImageTypes: string[]
  private readonly maxUploadSizeBytes: number

  constructor(
    config: StorageConfig,
    options?: {
      allowedAudioTypes?: string[]
      allowedImageTypes?: string[]
      maxUploadSizeMB?: number
    },
  ) {
    this.config = config
    this.allowedAudioTypes = options?.allowedAudioTypes || DEFAULT_ALLOWED_AUDIO_TYPES
    this.allowedImageTypes = options?.allowedImageTypes || DEFAULT_ALLOWED_IMAGE_TYPES
    this.maxUploadSizeBytes = (options?.maxUploadSizeMB || 50) * 1024 * 1024
  }

  private computeSha256(buffer: Buffer) {
    return createHash("sha256").update(buffer).digest("hex")
  }

  private generatePath(category: "audio" | "image" | "document", originalName: string) {
    const timestamp = Date.now()
    const random = Math.random().toString(36).slice(2, 10)
    const ext = path.extname(originalName) || ".bin"
    return `${category}/${timestamp}-${random}${ext}`
  }

  validateFile(file: StorageFile, category: "audio" | "image" | "document") {
    if (file.size > this.maxUploadSizeBytes) {
      return {
        valid: false,
        error: `File size exceeds maximum allowed size of ${this.maxUploadSizeBytes / 1024 / 1024}MB`,
      }
    }

    if (category === "audio" && !this.allowedAudioTypes.includes(file.mimeType)) {
      return {
        valid: false,
        error: `Invalid audio file type. Allowed: ${this.allowedAudioTypes.join(", ")}`,
      }
    }

    if (category === "image" && !this.allowedImageTypes.includes(file.mimeType)) {
      return {
        valid: false,
        error: `Invalid image file type. Allowed: ${this.allowedImageTypes.join(", ")}`,
      }
    }

    return { valid: true as const }
  }

  async upload(file: StorageFile, category: "audio" | "image" | "document"): Promise<UploadResult> {
    const validation = this.validateFile(file, category)
    if (!validation.valid) {
      throw new Error(validation.error)
    }

    const sha256 = this.computeSha256(file.buffer)
    const storagePath = this.generatePath(category, file.originalName)

    if (this.config.driver === "local") {
      return this.uploadLocal(file, storagePath, sha256)
    }

    // S3/MinIO adapters can reuse the same contract later.
    return this.uploadLocal(file, storagePath, sha256)
  }

  private async uploadLocal(file: StorageFile, storagePath: string, sha256: string) {
    const localRoot = this.config.localRoot || "./.data/storage"
    const fullPath = path.join(localRoot, storagePath)
    const dir = path.dirname(fullPath)

    if (!existsSync(dir)) {
      await mkdir(dir, { recursive: true })
    }

    await writeFile(fullPath, file.buffer)

    return {
      storageBucket: "local",
      storagePath,
      sha256,
      size: file.size,
    }
  }

  async getFile(storagePath: string) {
    const localRoot = this.config.localRoot || "./.data/storage"
    return readFile(path.join(localRoot, storagePath))
  }
}

export function createStorageService() {
  const allowedAudioTypes = process.env.ALLOWED_AUDIO_MIME_TYPES?.split(",")
  const maxUploadSizeMB = process.env.MAX_UPLOAD_SIZE_MB
    ? Number.parseInt(process.env.MAX_UPLOAD_SIZE_MB, 10)
    : undefined

  return new StorageService(
    {
      driver: (process.env.STORAGE_DRIVER as "local" | "s3" | "minio") || "local",
      localRoot: process.env.STORAGE_LOCAL_ROOT,
      bucket: process.env.STORAGE_BUCKET,
      s3Endpoint: process.env.S3_ENDPOINT,
      s3Region: process.env.S3_REGION,
      s3AccessKey: process.env.S3_ACCESS_KEY,
      s3SecretKey: process.env.S3_SECRET_KEY,
      s3ForcePathStyle: process.env.S3_FORCE_PATH_STYLE === "true",
    },
    {
      allowedAudioTypes,
      maxUploadSizeMB,
    },
  )
}

export const storage = createStorageService()
