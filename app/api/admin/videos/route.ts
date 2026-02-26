import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createVideoSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Video } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const videos = await Video.find().lean()

    return NextResponse.json({ videos })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createVideoSchema.parse(body)

    await connectDB()

    const video = await Video.create(parsed)

    return NextResponse.json({ video }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
