import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const url = new URL(req.url)
    const status = String(url.searchParams.get("status") || "").trim()

    const query: any = {}
    if (status) {
      query.status = status
    }

    const clean = sanitize(query) as typeof query

    const appointments = await Appointment.find(clean)
      .populate("userId", "name email")
      .populate("slotId")
      .lean()

    return NextResponse.json({ appointments })
  } catch (error) {
    return handleApiError(error)
  }
}
