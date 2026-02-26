import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createLotissementSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Lotissement } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const lotissements = await Lotissement.find().lean()

    return NextResponse.json({ lotissements })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createLotissementSchema.parse(body)

    await connectDB()

    const lotissement = await Lotissement.create(parsed)

    return NextResponse.json({ lotissement }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
