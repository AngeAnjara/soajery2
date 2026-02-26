import { NextResponse } from "next/server"
import { z } from "zod"

import { env } from "@/lib/env"

export class ApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

export function handleApiError(error: unknown) {
  if (error instanceof ApiError) {
    return NextResponse.json({ error: error.message }, { status: error.statusCode })
  }

  if (error instanceof z.ZodError) {
    return NextResponse.json(
      { error: "Validation error", fields: error.flatten().fieldErrors },
      { status: 422 },
    )
  }

  const message = env.NODE_ENV === "production" ? "Internal server error" : "Internal server error"
  return NextResponse.json({ error: message }, { status: 500 })
}
