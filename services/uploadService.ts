import { mkdir, writeFile } from "fs/promises"
import path from "path"
import crypto from "crypto"

import { ApiError } from "@/lib/apiError"
import { env } from "@/lib/env"

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"])
const MAX_SIZE_BYTES = 5 * 1024 * 1024

function getExt(file: File) {
  const byMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "application/pdf": "pdf",
  }

  return byMime[file.type] || "bin"
}

export async function saveProofImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ApiError(400, "Invalid file type")
  }

  if (file.size > MAX_SIZE_BYTES) {
    throw new ApiError(400, "File too large")
  }

  const dir = env.UPLOAD_DIR
  await mkdir(dir, { recursive: true })

  const ext = getExt(file)
  const filename = `proof_${Date.now()}_${crypto.randomUUID()}.${ext}`

  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(path.join(dir, filename), buffer)

  return `/uploads/${filename}`
}

export async function saveUploadedFile(file: File): Promise<string> {
  return saveProofImage(file)
}
