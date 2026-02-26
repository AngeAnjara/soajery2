import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment } from "@/models"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const body = sanitize(await req.json()) as { status?: string }

    const status = String(body.status || "")
    if (!status) {
      throw new ApiError(400, "Invalid status")
    }

    const appointment = await Appointment.findByIdAndUpdate(id, { status }, { new: true }).lean()

    if (!appointment) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const appointment = await Appointment.findByIdAndDelete(id).lean()

    if (!appointment) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
