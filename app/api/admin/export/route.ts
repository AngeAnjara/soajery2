import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment, ManualPayment, User } from "@/models"

function toCsv(rows: Record<string, any>[]) {
  if (!rows.length) return ""

  const headers = Object.keys(rows[0])
  const escape = (v: any) => {
    const s = String(v ?? "")
    const safe = s.replace(/\"/g, '""')
    if (safe.includes(",") || safe.includes("\n") || safe.includes('"')) {
      return `"${safe.replace(/"/g, '""')}"`
    }
    return safe
  }

  const lines = [headers.join(",")]
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","))
  }
  return lines.join("\n")
}

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const url = new URL(req.url)
    const type = String(url.searchParams.get("type") || "")

    if (type !== "users" && type !== "appointments" && type !== "payments") {
      throw new ApiError(400, "Invalid type")
    }

    let rows: Record<string, any>[] = []

    if (type === "users") {
      const docs = await User.find().select("-password").lean()
      rows = docs.map((u: any) => ({
        id: String(u._id),
        name: u.name,
        email: u.email,
        role: u.role,
        createdAt: u.createdAt,
      }))
    }

    if (type === "appointments") {
      const docs = await Appointment.find().lean()
      rows = docs.map((a: any) => ({
        id: String(a._id),
        userId: String(a.userId),
        date: a.date,
        status: a.status,
        price: a.price,
        createdAt: a.createdAt,
      }))
    }

    if (type === "payments") {
      const docs = await ManualPayment.find().lean()
      rows = docs.map((p: any) => ({
        id: String(p._id),
        userId: String(p.userId),
        relatedTo: p.relatedTo,
        relatedId: String(p.relatedId),
        amount: p.amount,
        mvolaPhone: p.mvolaPhone,
        transactionRef: p.transactionRef,
        status: p.status,
        createdAt: p.createdAt,
      }))
    }

    const csv = toCsv(rows)

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": 'attachment; filename="export.csv"',
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
