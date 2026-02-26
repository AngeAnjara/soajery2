import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { Lotissement } from "@/models"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await connectDB()
    const lotissements = await Lotissement.find().lean()
    return NextResponse.json({ lotissements })
  } catch (error) {
    return handleApiError(error)
  }
}
