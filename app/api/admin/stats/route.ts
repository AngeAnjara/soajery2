import { NextResponse, type NextRequest } from "next/server"

import { handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment, ManualPayment, User } from "@/models"

export async function GET(req: NextRequest) {
  try {
    requireAdmin(req)
    await connectDB()

    const now = new Date()
    const start7 = new Date(now)
    start7.setDate(now.getDate() - 6)
    start7.setHours(0, 0, 0, 0)

    const [
      totalUsers,
      appointmentByStatus,
      paymentByStatus,
      revenueAgg,
      last7Appointments,
    ] = await Promise.all([
      User.countDocuments(),
      Appointment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ManualPayment.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
      ManualPayment.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Appointment.aggregate([
        { $match: { createdAt: { $gte: start7 } } },
        {
          $group: {
            _id: {
              y: { $year: "$createdAt" },
              m: { $month: "$createdAt" },
              d: { $dayOfMonth: "$createdAt" },
            },
            count: { $sum: 1 },
          },
        },
        { $sort: { "_id.y": 1, "_id.m": 1, "_id.d": 1 } },
      ]),
    ])

    const totalRevenue = revenueAgg?.[0]?.total || 0

    const appointmentsLast7Days = last7Appointments.map((d: any) => ({
      label: `${String(d._id.d).padStart(2, "0")}/${String(d._id.m).padStart(2, "0")}`,
      value: d.count,
    }))

    return NextResponse.json({
      totalUsers,
      appointmentByStatus,
      paymentByStatus,
      totalRevenue,
      appointmentsLast7Days,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
