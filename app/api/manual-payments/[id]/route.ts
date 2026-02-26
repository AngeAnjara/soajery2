import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireUser } from "@/middlewares/authMiddleware"
import { ManualPayment } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = requireUser(req)

    await connectDB()

    const payment = await ManualPayment.findById(id).lean()

    if (!payment) {
      throw new ApiError(404, "Not found")
    }

    if (payment.userId?.toString?.() !== payload.userId) {
      throw new ApiError(403, "Forbidden")
    }

    return NextResponse.json({ payment })
  } catch (error) {
    return handleApiError(error)
  }
}
