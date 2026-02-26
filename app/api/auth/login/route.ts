import bcrypt from "bcryptjs"
import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { setAuthCookie } from "@/lib/cookies"
import { signToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { createRateLimiter } from "@/lib/rateLimit"
import { loginSchema } from "@/lib/validations/auth"
import { User } from "@/models"

const loginRateLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 })

export async function POST(req: NextRequest) {
  try {
    await loginRateLimiter(req)

    const body = await req.json()
    const parsed = loginSchema.parse(body)
    const normalized = {
      ...parsed,
      email: parsed.email.trim().toLowerCase(),
    }

    const clean = sanitize(normalized) as typeof normalized

    await connectDB()

    const user = await User.findOne({ email: clean.email }).select("+password")

    if (!user || !user.password) {
      throw new ApiError(401, "Invalid credentials")
    }

    const ok = await bcrypt.compare(clean.password, user.password)

    if (!ok) {
      throw new ApiError(401, "Invalid credentials")
    }

    const token = signToken({ userId: user._id.toString(), role: user.role })

    const response = NextResponse.json({
      user: {
        _id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
      },
    })

    setAuthCookie(response, token)
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
