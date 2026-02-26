import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { AvailableSlot } from "@/models"

export async function GET() {
  try {
    await connectDB()

    const now = new Date()
    const startOfTodayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0))

    const slots = await AvailableSlot.find({
      isActive: true,
      date: { $gte: startOfTodayUtc },
      $expr: { $lt: ["$bookedSlots", "$maxSlots"] },
    })
      .sort({ date: 1 })
      .lean()

    return NextResponse.json({ slots })
  } catch (error) {
    return handleApiError(error)
  }
}
