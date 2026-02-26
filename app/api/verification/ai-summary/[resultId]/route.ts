import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireUser } from "@/middlewares/authMiddleware"
import { VerificationFlow, VerificationResult } from "@/models"
import { generatePrompt } from "@/services/aiService"

function extractSections(text: string) {
  const t = String(text || "")

  const summaryMatch = t.match(/(?:^|\n)1\)\s*R[ée]sum[ée]\s*:\s*([\s\S]*?)(?=\n\s*2\)\s*Analyse\s*:|$)/i)
  const analysisMatch = t.match(/(?:^|\n)2\)\s*Analyse\s*:\s*([\s\S]*?)(?=\n\s*3\)\s*Recommandation\s*:|$)/i)
  const recommendationMatch = t.match(/(?:^|\n)3\)\s*Recommandation\s*:\s*([\s\S]*?)(?=\n\s*4\)\s*Niveau\s*de\s*confiance\s*:|$)/i)
  const confidenceMatch = t.match(/(?:^|\n)4\)\s*Niveau\s*de\s*confiance\s*:\s*([\s\S]*?)$/i)

  return {
    summary: summaryMatch?.[1]?.trim() || "",
    analysis: analysisMatch?.[1]?.trim() || "",
    recommendation: recommendationMatch?.[1]?.trim() || "",
    confidence: confidenceMatch?.[1]?.trim() || "",
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ resultId: string }> }) {
  try {
    const { resultId } = await params
    const payload = requireUser(req)

    const apiKey = process.env.TOGETHER_API_KEY
    if (!apiKey) {
      throw new ApiError(500, "Missing TOGETHER_API_KEY")
    }

    await connectDB()

    const result = await VerificationResult.findById(resultId)
    if (!result) {
      throw new ApiError(404, "Not found")
    }

    if (result.userId.toString() !== payload.userId) {
      throw new ApiError(403, "Forbidden")
    }

    const flow = await VerificationFlow.findById(result.flowId).lean()
    if (!flow) {
      throw new ApiError(404, "Flow not found")
    }

    const prompt = generatePrompt(result.answers as any, ((flow as any).nodes || []) as any)

    const model = process.env.TOGETHER_MODEL || "meta-llama/Llama-3.1-8B-Instruct-Turbo"

    const res = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "Tu produis un résumé et une analyse en français. Respecte strictement les 4 sections numérotées demandées.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
    })

    const data = await res.json().catch(() => null)
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || "Together API error"
      throw new ApiError(502, msg)
    }

    const content =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.text ??
      ""

    const parsed = extractSections(String(content || ""))

    result.aiAnalysis = parsed
    if (parsed.summary) {
      result.summary = parsed.summary
    }
    await result.save()

    return NextResponse.json({
      resultId: result._id.toString(),
      aiAnalysis: parsed,
      raw: content,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
