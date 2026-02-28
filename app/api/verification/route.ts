import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { evaluateVerificationSchema } from "@/lib/validations/verification"
import { requireUser } from "@/middlewares/authMiddleware"
import { VerificationFlow, VerificationResult } from "@/models"
import { runFlow } from "@/services/flowRunner"

export async function GET() {
  try {
    await connectDB()
    const flows = await VerificationFlow.find().lean()
    return NextResponse.json({ flows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireUser(req)

    const body = await req.json()
    const parsed = evaluateVerificationSchema.parse(body)
    const clean = sanitize(parsed) as typeof parsed

    await connectDB()

    const flow = await VerificationFlow.findById(clean.flowId).lean()
    if (!flow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const run = runFlow(
      {
        nodes: (flow as any).nodes || [],
        edges: (flow as any).edges || [],
        version: Number((flow as any).version || 1),
        status: ((flow as any).status || "draft") as any,
        startNodeId: String((flow as any).startNodeId || ""),
      },
      clean.answers as any,
    )

    const result = await VerificationResult.create({
      userId: payload.userId,
      flowId: clean.flowId,
      answers: clean.answers,
      aiAnalysis: undefined,
      resultNodeId: run.resultNodeId,
      summary: run.description || run.title || "",
      status: "pending",
    })

    return NextResponse.json({
      resultId: result._id.toString(),
      nextNodeId: run.nextNodeId,
      actionType: run.actionType,
      prompt: run.actionType === "call_ai" ? run.prompt : undefined,
      aiAnalysis: (result as any).aiAnalysis,
      resultType: run.resultType,
      resultColor: run.resultColor,
      resultTitle: run.title,
      resultDescription: run.description,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
