import { NextResponse, type NextRequest } from "next/server"

import { verifyTokenPayload } from "@/lib/jwt"

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
}

function isPublicPath(pathname: string) {
  return pathname.startsWith("/login") || pathname.startsWith("/api/auth")
}

export function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  if (isPublicPath(pathname)) {
    return NextResponse.next()
  }

  const token = request.cookies.get("token")?.value

  if (pathname.startsWith("/api/admin")) {
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    try {
      verifyTokenPayload(token)
      return NextResponse.next()
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  if (pathname.startsWith("/admin")) {
    if (!token) {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }

    try {
      verifyTokenPayload(token)
      return NextResponse.next()
    } catch {
      const url = request.nextUrl.clone()
      url.pathname = "/login"
      url.searchParams.set("next", pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}
