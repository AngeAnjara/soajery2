import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireUser } from "@/middlewares/authMiddleware"
import { User } from "@/models"

export async function GET(req: NextRequest) {
  try {
    const { userId } = requireUser(req)

    await connectDB()

    const user = await User.findById(userId)

    if (!user) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
