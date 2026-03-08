import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { VerificationFlow } from "@/models"
import { getVisibleQuestionSequence, preRunFlow } from "@/services/flowRunner"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await connectDB()

    const flow = await VerificationFlow.findOne({ _id: id, status: "published" }).lean()
    if (!flow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const flowDef = {
      nodes: (flow as any).nodes || [],
      edges: (flow as any).edges || [],
      version: Number((flow as any).version || 1),
      status: ((flow as any).status || "draft") as any,
      startNodeId: String((flow as any).startNodeId || ""),
    }

    const questions = getVisibleQuestionSequence(flowDef as any, {})
    const preview = preRunFlow(flowDef as any, {})
    const terminalAlert = preview.resultType === "alert"

    return NextResponse.json({
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

    const flow = await VerificationFlow.findOne({ _id: id, status: "published" }).lean()
    if (!flow) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    const flowDef = {
      nodes: (flow as any).nodes || [],
      edges: (flow as any).edges || [],
      version: Number((flow as any).version || 1),
      status: ((flow as any).status || "draft") as any,
      startNodeId: String((flow as any).startNodeId || ""),
    }

    const questions = getVisibleQuestionSequence(flowDef as any, answers)
    const preview = preRunFlow(flowDef as any, answers)
    const terminalAlert = preview.resultType === "alert"

    return NextResponse.json({
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
