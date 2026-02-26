import type { NextResponse } from "next/server"

import { env } from "@/lib/env"

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: false, // Disabled for HTTP on VPS
    sameSite: "lax", // Changed from strict for HTTP compatibility
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: false, // Disabled for HTTP on VPS
    sameSite: "lax", // Changed from strict for HTTP compatibility
    path: "/",
    maxAge: 0,
  })
}
