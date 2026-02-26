import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { ManualPayment, User } from "@/models"
import { sendPaymentRejected } from "@/services/emailService"
import { logger } from "@/utils/logger"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    requireAdmin(req)
    await connectDB()

    const { id } = await params

    const payment = await ManualPayment.findById(id)

    if (!payment) {
      throw new ApiError(404, "Not found")
    }

    payment.status = "rejected"
    await payment.save()

    const paymentUser = await User.findById(payment.userId)
    if (paymentUser) {
      await sendPaymentRejected(paymentUser.email, paymentUser.name, payment.amount)
    }

    logger.info("Payment rejected", {
      paymentId: payment._id.toString(),
      userId: payment.userId.toString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
