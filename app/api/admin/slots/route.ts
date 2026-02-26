import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createSlotSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { AvailableSlot } from "@/models"

function parseDateOnlyToUtc(dateStr: string) {
  const [y, m, d] = dateStr.split("-").map((n) => Number(n))
  return new Date(Date.UTC(y, m - 1, d, 0, 0, 0, 0))
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const slots = await AvailableSlot.find().sort({ date: 1 }).lean()

    return NextResponse.json({ slots })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createSlotSchema.parse(body)

    await connectDB()

    const slot = await AvailableSlot.create({
      date: parseDateOnlyToUtc(parsed.date),
      maxSlots: parsed.maxSlots,
      bookedSlots: 0,
      price: parsed.price,
      isActive: true,
    })

    return NextResponse.json({ slot }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
