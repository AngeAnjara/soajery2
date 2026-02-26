import type { NextResponse } from "next/server"

import { env } from "@/lib/env"

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set({
    name: "token",
    value: token,
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 7 * 24 * 60 * 60,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set({
    name: "token",
    value: "",
    httpOnly: true,
    secure: env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 0,
  })
}
