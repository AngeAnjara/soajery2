import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"
import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createNewsSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { News } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const news = await News.findById(id).lean()

    if (!news) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ news })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createNewsSchema.partial().parse(body)

    await connectDB()

    const { id } = await params

    const news = await News.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!news) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ news })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const news = await News.findByIdAndDelete(id).lean()

    if (!news) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
