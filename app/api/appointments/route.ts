import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createAppointmentSchema } from "@/lib/validations/appointment"
import { requireUser } from "@/middlewares/authMiddleware"
import { Appointment, AvailableSlot } from "@/models"

export async function GET(req: NextRequest) {
  try {
    const payload = requireUser(req)

    await connectDB()

    const appointments = await Appointment.find({ userId: payload.userId })
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ appointments })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = requireUser(req)

    const body = await req.json()
    const parsed = createAppointmentSchema.parse(body)
    const clean = sanitize(parsed) as typeof parsed

    await connectDB()

    const slot = await AvailableSlot.findById(clean.slotId)

    if (!slot || !slot.isActive || slot.bookedSlots >= slot.maxSlots) {
      throw new ApiError(409, "No slots available")
    }

    const appointment = await Appointment.create({
      userId: payload.userId,
      slotId: clean.slotId,
      date: new Date(clean.date),
      price: clean.price,
      status: "pending",
    })

    return NextResponse.json({ appointment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
