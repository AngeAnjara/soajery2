import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { cancelAppointmentSchema } from "@/lib/validations/appointment"
import { requireUser } from "@/middlewares/authMiddleware"
import { Appointment } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = requireUser(req)

    await connectDB()

    const appointment = await Appointment.findById(id).lean()

    if (!appointment) {
      throw new ApiError(404, "Not found")
    }

    const owned = appointment.userId?.toString?.() === payload.userId

    if (!owned && payload.role !== "admin") {
      throw new ApiError(403, "Forbidden")
    }

    return NextResponse.json({ appointment })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const payload = requireUser(req)

    const body = await req.json()
    const parsed = cancelAppointmentSchema.parse(body)
    sanitize(parsed)

    await connectDB()

    const appointment = await Appointment.findById(id)

    if (!appointment) {
      throw new ApiError(404, "Not found")
    }

    if (appointment.userId.toString() !== payload.userId) {
      throw new ApiError(403, "Forbidden")
    }

    if (appointment.status !== "pending" && appointment.status !== "waiting_payment_verification") {
      throw new ApiError(400, "Cannot cancel this appointment")
    }

    appointment.status = "cancelled"
    await appointment.save()

    return NextResponse.json({ appointment })
  } catch (error) {
    return handleApiError(error)
  }
}
