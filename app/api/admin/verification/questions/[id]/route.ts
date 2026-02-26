import { NextResponse, type NextRequest } from "next/server"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: "Gone" }, { status: 410 })
}
