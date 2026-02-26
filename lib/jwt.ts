import jwt, { type SignOptions } from "jsonwebtoken"

import { ApiError } from "@/lib/apiError"
import { env } from "@/lib/env"

export function signToken(payload: { userId: string; role: string }): string {
  const options = { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
  return jwt.sign(payload, env.JWT_SECRET, options)
}

export function verifyTokenPayload(token: string): {
  userId: string
  role: string
  iat: number
  exp: number
} {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET)
    const payload = decoded as { userId: string; role: string; iat: number; exp: number }

    if (!payload?.userId || !payload?.role) {
      throw new ApiError(401, "Invalid token")
    }

    return payload
  } catch {
    throw new ApiError(401, "Invalid token")
  }
}
