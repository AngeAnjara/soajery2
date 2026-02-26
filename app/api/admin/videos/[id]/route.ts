import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createVideoSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Video } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const video = await Video.findById(id).lean()

    if (!video) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ video })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createVideoSchema.partial().parse(body)

    await connectDB()

    const { id } = await params

    const video = await Video.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!video) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ video })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const video = await Video.findByIdAndDelete(id).lean()

    if (!video) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
