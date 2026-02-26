import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { News } from "@/models"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await connectDB()
    const news = await News.find().lean()
    return NextResponse.json({ news })
  } catch (error) {
    return handleApiError(error)
  }
}
