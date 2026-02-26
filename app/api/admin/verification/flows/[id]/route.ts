import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createFlowSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { VerificationFlow } from "@/models"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const { id } = await params
    const body = sanitize(await req.json())
    const parsed = createFlowSchema.partial().parse(body)

    await connectDB()

    const flow = await VerificationFlow.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!flow) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ flow })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const flow = await VerificationFlow.findByIdAndDelete(id).lean()

    if (!flow) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
