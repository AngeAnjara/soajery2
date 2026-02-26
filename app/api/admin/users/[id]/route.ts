import sanitize from "mongo-sanitize"
import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment, ManualPayment, User } from "@/models"

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const body = sanitize(await req.json()) as { role?: string }

    const role = body.role

    if (role !== "admin" && role !== "user") {
      throw new ApiError(400, "Invalid role")
    }

    const user = await User.findByIdAndUpdate(id, { role }, { new: true })
      .select("-password")
      .lean()

    if (!user) {
      throw new ApiError(404, "Not found")
    }

    return NextResponse.json({ user })
  } catch (error) {
    return handleApiError(error)
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const user = await User.findById(id)

    if (!user) {
      throw new ApiError(404, "Not found")
    }

    await Appointment.deleteMany({ userId: user._id })
    await ManualPayment.deleteMany({ userId: user._id })
    await User.findByIdAndDelete(user._id)

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
