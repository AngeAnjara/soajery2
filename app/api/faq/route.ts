import { NextResponse } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { FAQ } from "@/models"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await connectDB()
    const faqs = await FAQ.find().lean()
    return NextResponse.json({ faqs })
  } catch (error) {
    return handleApiError(error)
  }
}
