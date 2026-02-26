import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { Definition } from "@/models"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await connectDB()
    const definitions = await Definition.find().lean()
    return NextResponse.json({ definitions })
  } catch (error) {
    return handleApiError(error)
  }
}
