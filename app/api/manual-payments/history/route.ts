import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireUser } from "@/middlewares/authMiddleware"
import { ManualPayment } from "@/models"
import { logger } from "@/utils/logger"

export async function GET(req: NextRequest) {
  try {
    const payload = requireUser(req)
    await connectDB()

    const url = new URL(req.url)

    const page = Number(url.searchParams.get("page") || "1")
    const limit = Number(url.searchParams.get("limit") || "10")
    const status = String(url.searchParams.get("status") || "").trim()

    const safePage = Number.isFinite(page) && page > 0 ? page : 1
    const safeLimit = Number.isFinite(limit) && limit > 0 ? Math.min(100, limit) : 10

    const query: any = { userId: payload.userId }
    if (status) {
      query.status = status
    }

    const clean = sanitize(query) as typeof query

    const [payments, total] = await Promise.all([
      ManualPayment.find(clean)
        .sort({ createdAt: -1 })
        .skip((safePage - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
      ManualPayment.countDocuments(clean),
    ])

    const totalPages = Math.max(1, Math.ceil(total / safeLimit))

    logger.info("Manual payment history", {
      userId: payload.userId,
      page: safePage,
      limit: safeLimit,
      status: status || null,
    })

    return NextResponse.json({ payments, total, page: safePage, totalPages })
  } catch (error) {
    return handleApiError(error)
  }
}
