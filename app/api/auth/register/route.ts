import bcrypt from "bcryptjs"
import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { setAuthCookie } from "@/lib/cookies"
import { signToken } from "@/lib/jwt"
import { connectDB } from "@/lib/mongodb"
import { createRateLimiter } from "@/lib/rateLimit"
import { registerSchema } from "@/lib/validations/auth"
import { User } from "@/models"

const registerRateLimiter = createRateLimiter({ limit: 10, windowMs: 15 * 60 * 1000 })

export async function POST(req: NextRequest) {
  try {
    await registerRateLimiter(req)

    const body = await req.json()
    const parsed = registerSchema.parse(body)
    const normalized = {
      ...parsed,
      email: parsed.email.trim().toLowerCase(),
    }

    const clean = sanitize(normalized) as typeof normalized

    await connectDB()

    const existing = await User.findOne({ email: clean.email })
    if (existing) {
      throw new ApiError(409, "Email already in use")
    }

    const hashed = await bcrypt.hash(clean.password, 12)

    const user = await User.create({
      name: clean.name,
      email: clean.email,
      password: hashed,
      role: "user",
    })

    const token = signToken({ userId: user._id.toString(), role: user.role })

    const response = NextResponse.json(
      {
        user: {
          _id: user._id.toString(),
          name: user.name,
          email: user.email,
          role: user.role,
        },
      },
      { status: 201 },
    )

    setAuthCookie(response, token)
    return response
  } catch (error) {
    return handleApiError(error)
  }
}
