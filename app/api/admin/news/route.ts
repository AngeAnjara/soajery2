import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"
import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createNewsSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { News } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()
    const news = await News.find().lean()

    return NextResponse.json({ news })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createNewsSchema.parse(body)
    await connectDB()
    const item = await News.create(parsed)
    return NextResponse.json({ news: item }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
