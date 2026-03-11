import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { evaluateVerificationSchema } from "@/lib/validations/verification"
import { requireUser } from "@/middlewares/authMiddleware"
import { VerificationFlow, VerificationResult } from "@/models"
import { runChainedFlows } from "@/services/flowRunner"

export async function GET() {
  try {
    await connectDB()
    const flows = await VerificationFlow.find({ status: "published", hidden: { $ne: true } }).lean()
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

    if (String((flow as any).status || "draft") !== "published") {
      return NextResponse.json({ error: "Flow not published" }, { status: 403 })
    }

    const startFlowDef = {
      nodes: (flow as any).nodes || [],
      edges: (flow as any).edges || [],
      version: Number((flow as any).version || 1),
      status: ((flow as any).status || "draft") as any,
      startNodeId: String((flow as any).startNodeId || ""),
    }

    const chained = await runChainedFlows({
      startFlowId: String(clean.flowId),
      startFlow: startFlowDef as any,
      answers: clean.answers as any,
      hopLimit: 10,
      getFlowById: async (flowId) => {
        const f = await VerificationFlow.findById(flowId).lean()
        if (!f) return null
        if (String((f as any).status || "draft") !== "published") return null
        return {
          nodes: (f as any).nodes || [],
          edges: (f as any).edges || [],
          version: Number((f as any).version || 1),
          status: ((f as any).status || "draft") as any,
          startNodeId: String((f as any).startNodeId || ""),
        } as any
      },
    })

    const run = chained.run

    const result = await VerificationResult.create({
      userId: payload.userId,
      flowId: chained.flowId,
      answers: clean.answers,
      aiAnalysis: undefined,
      resultNodeId: run.resultNodeId,
      transitionLineage: chained.lineage,
      summary: run.description || run.title || "",
      status: "pending",
    })

    return NextResponse.json({
      resultId: result._id.toString(),
      resolvedFlowId: chained.flowId,
      nextNodeId: run.nextNodeId,
      actionType: run.actionType,
      prompt: run.actionType === "call_ai" ? run.prompt : undefined,
      redirect: run.actionType === "redirect" ? (run as any).redirect : undefined,
      transition: run.actionType === "transition" ? (run as any).transition : undefined,
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
