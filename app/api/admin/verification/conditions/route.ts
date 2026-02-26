import { NextResponse, type NextRequest } from "next/server"

export async function GET(req: NextRequest) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}

export async function POST(req: NextRequest) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}
