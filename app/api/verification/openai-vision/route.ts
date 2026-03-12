import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { readFile } from "fs/promises"
import path from "path"

import { ApiError, handleApiError } from "@/lib/apiError"
import { env } from "@/lib/env"

const bodySchema = z.object({
  fileUrl: z.union([z.string().min(1), z.array(z.string().min(1)).min(1)]),
  model: z.enum(["gpt-4o", "gpt-4-turbo", "gpt-4-vision-preview"]),
  prompt: z.string().min(1),
})

export async function POST(req: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY
    if (!apiKey) {
      throw new ApiError(500, "Missing OPENAI_API_KEY")
    }

    const json = await req.json().catch(() => ({}))
    const body = bodySchema.parse(json)

    const buildImageUrl = async (fileUrl: string) => {
      const raw = String(fileUrl || "").trim()
      if (!raw) throw new ApiError(400, "fileUrl is required")

      if (raw.endsWith(".zip") || raw.includes(".zip?")) {
        throw new ApiError(400, "ZIP is not supported for Vision image analysis")
      }

      if (raw.startsWith("http://") || raw.startsWith("https://") || raw.startsWith("data:")) {
        return raw
      }

      if (raw.startsWith("/uploads/")) {
        const filename = path.basename(raw)
        const ext = path.extname(filename).toLowerCase()

        const mime =
          ext === ".jpg" || ext === ".jpeg"
            ? "image/jpeg"
            : ext === ".png"
              ? "image/png"
              : ext === ".webp"
                ? "image/webp"
                : ext === ".pdf"
                  ? "application/pdf"
                  : ""

        if (!mime) {
          throw new ApiError(400, "Unsupported uploaded file extension")
        }
        if (mime === "application/pdf") {
          throw new ApiError(400, "PDF is not supported for Vision image analysis")
        }

        const dir = env.UPLOAD_DIR
        const absDir = path.isAbsolute(dir) ? dir : path.join(process.cwd(), dir)
        const absPath = path.join(absDir, filename)

        const buffer = await readFile(absPath)
        const b64 = buffer.toString("base64")
        return `data:${mime};base64,${b64}`
      }

      throw new ApiError(400, "Invalid fileUrl")
    }

    const rawUrls = Array.isArray(body.fileUrl) ? body.fileUrl : [body.fileUrl]
    const cleaned = rawUrls
      .map((u) => String(u || "").trim())
      .filter((u) => u)

    if (!cleaned.length) {
      throw new ApiError(400, "fileUrl is required")
    }

    const imageUrls = await Promise.all(cleaned.map((u) => buildImageUrl(u)))
    const contentParts = [
      ...imageUrls.map((url) => ({ type: "image_url", image_url: { url } })),
      { type: "text", text: body.prompt },
    ]

    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: body.model,
        messages: [
          {
            role: "user",
            content: contentParts,
          },
        ],
        response_format: { type: "json_object" },
        max_tokens: 1024,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || "OpenAI API error"
      throw new ApiError(502, msg)
    }

    const content = data?.choices?.[0]?.message?.content ?? ""

    try {
      const parsed = JSON.parse(String(content || ""))
      return NextResponse.json({ result: parsed })
    } catch {
      return NextResponse.json({ result: { raw: content } })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
