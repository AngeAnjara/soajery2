import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"

import { ApiError, handleApiError } from "@/lib/apiError"

const bodySchema = z.object({
  fileUrl: z.string().min(1),
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
            content: [
              {
                type: "image_url",
                image_url: { url: body.fileUrl },
              },
              {
                type: "text",
                text: body.prompt,
              },
            ],
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
