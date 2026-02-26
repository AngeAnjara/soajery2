import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { Video } from "@/models"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await connectDB()
    const videos = await Video.find().lean()
    return NextResponse.json({ videos })
  } catch (error) {
    return handleApiError(error)
  }
}
