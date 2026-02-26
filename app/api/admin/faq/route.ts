import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createFaqSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { FAQ } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const faqs = await FAQ.find().lean()

    return NextResponse.json({ faqs })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createFaqSchema.parse(body)

    await connectDB()

    const faq = await FAQ.create(parsed)

    return NextResponse.json({ faq }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
