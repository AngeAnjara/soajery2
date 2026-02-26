import type { NextRequest } from "next/server"

import { ApiError } from "@/lib/apiError"

type RateLimitEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, RateLimitEntry>()

function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0]?.trim() || forwarded.trim()

  const anyReq = req as unknown as { ip?: string }
  return anyReq.ip || "unknown"
}

export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  return async function rateLimit(req: NextRequest) {
    const ip = getClientIp(req)
    const now = Date.now()

    const existing = store.get(ip)

    if (!existing || existing.resetAt <= now) {
      store.set(ip, { count: 1, resetAt: now + windowMs })
      return
    }

    existing.count += 1

    if (existing.count > limit) {
      throw new ApiError(429, "Too many requests")
    }
  }
}
