import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { updateSlotSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { AvailableSlot } from "@/models"

function parseDateOnlyToUtc(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n))
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = updateSlotSchema.parse(body)

    await connectDB()

    const update: any = {}
    if (parsed.date) update.date = parseDateOnlyToUtc(parsed.date)
    if (typeof parsed.maxSlots === "number") update.maxSlots = parsed.maxSlots
    if (typeof parsed.price === "number") update.price = parsed.price
    if (typeof (parsed as any).isActive === "boolean") update.isActive = (parsed as any).isActive

    const slot = await AvailableSlot.findByIdAndUpdate(id, update, { new: true }).lean()

    if (!slot) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ slot })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    requireAdmin(req)
    await connectDB()

    const slot = await AvailableSlot.findById(id)

    if (!slot) {
      throw new ApiError(404, "Not found")
    }

    if (slot.bookedSlots > 0) {
      throw new ApiError(409, "Slot has bookings")
    }

    await AvailableSlot.findByIdAndDelete(slot._id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
