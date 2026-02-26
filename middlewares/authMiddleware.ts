import type { NextRequest } from "next/server"

import { ApiError } from "@/lib/apiError"
import { verifyTokenPayload } from "@/lib/jwt"

export function verifyToken(req: NextRequest) {
  const token = req.cookies.get("token")?.value
  if (!token) {
    throw new ApiError(401, "Unauthorized")
  }

  return verifyTokenPayload(token)
}

export function requireUser(req: NextRequest) {
  return verifyToken(req)
}

export function requireAdmin(req: NextRequest) {
  const payload = requireUser(req)

  if (payload.role !== "admin") {
    throw new ApiError(403, "Forbidden")
  }

  return payload
}
