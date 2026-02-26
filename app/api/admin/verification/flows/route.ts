import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createFlowSchema } from "@/lib/validations/admin"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { VerificationFlow } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const flows = await VerificationFlow.find().lean()

    return NextResponse.json({ flows })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function POST(req: NextRequest) {
  try {
    requireAdmin(req)
    const body = sanitize(await req.json())
    const parsed = createFlowSchema.parse(body)

    await connectDB()

    const flow = await VerificationFlow.create(parsed)

    return NextResponse.json({ flow }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
