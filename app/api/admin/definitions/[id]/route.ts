import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createDefinitionSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Definition } from "@/models"

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const definition = await Definition.findById(id).lean()

    if (!definition) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ definition })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createDefinitionSchema.partial().parse(body)

    await connectDB()

    const { id } = await params

    const definition = await Definition.findByIdAndUpdate(id, parsed, { new: true }).lean()

    if (!definition) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ definition })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const definition = await Definition.findByIdAndDelete(id).lean()

    if (!definition) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
