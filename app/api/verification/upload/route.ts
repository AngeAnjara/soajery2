import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { saveUploadedFile } from "@/services/uploadService"
import { requireUser } from "@/middlewares/authMiddleware"

export async function POST(req: NextRequest) {
  try {
    requireUser(req)

    const form = await req.formData()
    const file = form.get("file")

    if (!(file instanceof File)) {
      throw new ApiError(400, "file is required")
    }

    const fileUrl = await saveUploadedFile(file)

    return NextResponse.json({ fileUrl })
  } catch (error) {
    return handleApiError(error)
  }
}
