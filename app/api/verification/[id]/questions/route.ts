import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { VerificationFlow } from "@/models"
import { getVisibleQuestionSequence, preRunFlow } from "@/services/flowRunner"

 async function resolveFlowForQuestions(opts: {
   startFlowId: string
   answers: Record<string, any>
   hopLimit?: number
 }) {
   const hopLimit = typeof opts.hopLimit === "number" && opts.hopLimit > 0 ? opts.hopLimit : 10

   let currentFlowId = String(opts.startFlowId)
   let currentFlowDef: any | null = null
   const visited = new Set<string>()
   let hops = 0

   while (true) {
     if (hops > hopLimit) break

     if (visited.has(currentFlowId)) break
     visited.add(currentFlowId)

     const flow = await VerificationFlow.findOne({ _id: currentFlowId, status: "published" }).lean()
     if (!flow) break

     const flowDef = {
       nodes: (flow as any).nodes || [],
       edges: (flow as any).edges || [],
       version: Number((flow as any).version || 1),
       status: ((flow as any).status || "draft") as any,
       startNodeId: String((flow as any).startNodeId || ""),
     }

     const preview = preRunFlow(flowDef as any, opts.answers || {})
     if (preview.actionType !== "transition" || !preview.transition?.flowId) {
       currentFlowId = String((flow as any)._id || currentFlowId)
       currentFlowDef = flowDef
       break
     }

     const targetFlowId = String(preview.transition.flowId)

     const entry = preview.transition?.entry
     const overrideStartNodeId =
       entry && typeof entry === "object" && (entry as any).type === "node" && typeof (entry as any).nodeId === "string" && String((entry as any).nodeId).trim() !== ""
         ? String((entry as any).nodeId)
         : ""

     currentFlowId = targetFlowId
     if (overrideStartNodeId) {
       const nextFlow = await VerificationFlow.findOne({ _id: currentFlowId, status: "published" }).lean()
       if (!nextFlow) break
       currentFlowDef = {
         nodes: (nextFlow as any).nodes || [],
         edges: (nextFlow as any).edges || [],
         version: Number((nextFlow as any).version || 1),
         status: ((nextFlow as any).status || "draft") as any,
         startNodeId: overrideStartNodeId,
       }
       break
     }

     hops += 1
   }

   if (!currentFlowDef) {
     const flow = await VerificationFlow.findOne({ _id: opts.startFlowId, status: "published" }).lean()
     if (!flow) return { resolvedFlowId: String(opts.startFlowId), flowDef: null }
     currentFlowId = String((flow as any)._id || opts.startFlowId)
     currentFlowDef = {
       nodes: (flow as any).nodes || [],
       edges: (flow as any).edges || [],
       version: Number((flow as any).version || 1),
       status: ((flow as any).status || "draft") as any,
       startNodeId: String((flow as any).startNodeId || ""),
     }
   }

   return { resolvedFlowId: currentFlowId, flowDef: currentFlowDef }
 }

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const resolved = await resolveFlowForQuestions({ startFlowId: id, answers: {} })
    if (!resolved.flowDef) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const questions = getVisibleQuestionSequence(resolved.flowDef as any, {})
    const preview = preRunFlow(resolved.flowDef as any, {})
    const terminalAlert = preview.resultType === "alert"

    return NextResponse.json({
      resolvedFlowId: resolved.resolvedFlowId,
      questions,
      terminalAlert,
      resultType: preview.resultType,
      resultColor: preview.resultColor,
      resultTitle: preview.title,
      resultDescription: preview.description,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const body = await req.json().catch(() => ({}))
    const answers = (body && typeof body === "object" ? (body as any).answers : {}) || {}

    await connectDB()

    const resolved = await resolveFlowForQuestions({ startFlowId: id, answers })
    if (!resolved.flowDef) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const questions = getVisibleQuestionSequence(resolved.flowDef as any, answers)
    const preview = preRunFlow(resolved.flowDef as any, answers)
    const terminalAlert = preview.resultType === "alert"

    return NextResponse.json({
      resolvedFlowId: resolved.resolvedFlowId,
      questions,
      terminalAlert,
      resultType: preview.resultType,
      resultColor: preview.resultColor,
      resultTitle: preview.title,
      resultDescription: preview.description,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
