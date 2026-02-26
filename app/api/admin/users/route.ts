import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { User } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const url = new URL(req.url)
    const search = String(url.searchParams.get("search") || "").trim()

    const query: any = {}
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ]
    }

    const clean = sanitize(query) as typeof query

    const users = await User.find(clean).select("-password").lean()

    return NextResponse.json({ users })
  } catch (error) {
    return handleApiError(error)
  }
}
