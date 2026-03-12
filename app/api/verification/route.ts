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

    const origin = new URL(req.url).origin

    const startFlowDef = {
      nodes: (flow as any).nodes || [],
      edges: (flow as any).edges || [],
      version: Number((flow as any).version || 1),
      status: ((flow as any).status || "draft") as any,
      startNodeId: String((flow as any).startNodeId || ""),
    }

    const startChainedRun = async (answers: any) => {
      return runChainedFlows({
        startFlowId: String(clean.flowId),
        startFlow: startFlowDef as any,
        answers,
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
    }

    const findUploadFileUrlForVision = (flowDef: any, visionNodeId: string, answers: any) => {
      const edges = Array.isArray(flowDef?.edges) ? flowDef.edges : []
      const nodes = Array.isArray(flowDef?.nodes) ? flowDef.nodes : []
      const incoming = edges.filter((e: any) => String(e?.target || "") === String(visionNodeId))
      for (const e of incoming) {
        const sourceId = String(e?.source || "")
        const src = nodes.find((n: any) => String(n?.id || "") === sourceId)
        if (src?.type === "upload") {
          const fieldKey = String(src?.data?.fieldKey || "")
          const v = answers?.[fieldKey]
          if (typeof v === "string" && v.trim() !== "") return v.trim()
        }
      }

      const candidate = Object.values(answers || {}).find(
        (v: any) => typeof v === "string" && v.trim() !== "" && (v.startsWith("/uploads/") || v.startsWith("http://") || v.startsWith("https://")),
      )
      return typeof candidate === "string" ? candidate.trim() : ""
    }

    let answers = { ...(clean.answers as any) }

    let chained = await startChainedRun(answers)

    if (chained.run?.pendingVisionNodeId && chained.run?.visionOutputFieldKey) {
      const visionNodeId = String(chained.run.pendingVisionNodeId)
      const outputFieldKey = String(chained.run.visionOutputFieldKey)
      const already = answers?.[outputFieldKey]

      if (already === undefined || already === null || (typeof already === "string" && already.trim() === "")) {
        const visionFlow = chained.flowId === String(clean.flowId) ? startFlowDef : await (async () => {
          const f = await VerificationFlow.findById(chained.flowId).lean()
          return f
            ? {
                nodes: (f as any).nodes || [],
                edges: (f as any).edges || [],
                version: Number((f as any).version || 1),
                status: ((f as any).status || "draft") as any,
                startNodeId: String((f as any).startNodeId || ""),
              }
            : startFlowDef
        })()

        const nodes = Array.isArray((visionFlow as any)?.nodes) ? (visionFlow as any).nodes : []
        const visionNode = nodes.find((n: any) => String(n?.id || "") === visionNodeId)
        const model = String(visionNode?.data?.model || chained.run.visionModel || "")
        const prompt = String(visionNode?.data?.prompt || chained.run.visionPrompt || "")
        const fileUrl = findUploadFileUrlForVision(visionFlow, visionNodeId, answers)

        const vres = await fetch(`${origin}/api/verification/openai-vision`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileUrl, model, prompt }),
        })
        const vjson = await vres.json().catch(() => ({}))
        if (!vres.ok) {
          return NextResponse.json({ error: vjson?.error || "Vision API error" }, { status: vres.status || 500 })
        }

        const visionResult = (vjson as any)?.result
        answers = { ...answers, [outputFieldKey]: visionResult }
        chained = await startChainedRun(answers)
        chained = { ...chained, run: { ...(chained.run as any), visionResult } }
      }
    }

    const run = chained.run

    const result = await VerificationResult.create({
      userId: payload.userId,
      flowId: chained.flowId,
      answers,
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
      pendingUploadNodeId: (run as any).pendingUploadNodeId,
      pendingVisionNodeId: (run as any).pendingVisionNodeId,
      visionModel: (run as any).visionModel,
      visionPrompt: (run as any).visionPrompt,
      visionOutputFieldKey: (run as any).visionOutputFieldKey,
      visionResult: (run as any).visionResult,
      resultType: run.resultType,
      resultColor: run.resultColor,
      resultTitle: run.title,
      resultDescription: run.description,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
