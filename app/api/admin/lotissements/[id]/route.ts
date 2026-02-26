import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createLotissementSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Lotissement } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const lotissement = await Lotissement.findById(id).lean()

    if (!lotissement) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ lotissement })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createLotissementSchema.partial().parse(body)

    await connectDB()

    const { id } = await params

    const lotissement = await Lotissement.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!lotissement) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ lotissement })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const lotissement = await Lotissement.findByIdAndDelete(id).lean()

    if (!lotissement) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
