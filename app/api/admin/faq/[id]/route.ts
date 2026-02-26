import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createFaqSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { FAQ } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const faq = await FAQ.findById(id).lean()

    if (!faq) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ faq })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createFaqSchema.partial().parse(body)

    await connectDB()

    const { id } = await params

    const faq = await FAQ.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!faq) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ faq })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const faq = await FAQ.findByIdAndDelete(id).lean()

    if (!faq) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
