import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { env } from "@/lib/env"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { Appointment, ManualPayment, User, VerificationFlow, VerificationResult } from "@/models"
import { sendPaymentApproved, sendPdfUnlocked } from "@/services/emailService"
import { generatePaymentReceiptPdf, generateVerificationReportPdf } from "@/services/pdfService"
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

    if (payment.status !== "pending") {
      throw new ApiError(400, "Payment is not pending")
    }

    payment.status = "approved"
    await payment.save()

    const paymentUser = await User.findById(payment.userId)

    if (!paymentUser) {
      throw new ApiError(400, "Invalid user")
    }

    let pdfBase64: string | null = null

    if (payment.relatedTo === "appointment") {
      await Appointment.findByIdAndUpdate(payment.relatedId, { status: "paid" })

      const receiptBuffer = await generatePaymentReceiptPdf({
        receiptNumber: payment._id.toString(),
        userName: paymentUser.name,
        userEmail: paymentUser.email,
        amount: payment.amount,
        relatedTo: "appointment",
        transactionRef: payment.transactionRef,
        mvolaPhone: payment.mvolaPhone,
        approvedAt: new Date(),
      })

      await sendPaymentApproved(
        paymentUser.email,
        paymentUser.name,
        payment.amount,
        "appointment",
        receiptBuffer,
      )

      pdfBase64 = null
    }

    if (payment.relatedTo === "verification") {
      const result = await VerificationResult.findByIdAndUpdate(
        payment.relatedId,
        { status: "unlocked" },
        { new: true },
      )

      if (!result) {
        throw new ApiError(400, "Invalid verification result")
      }

      const flow = await VerificationFlow.findById(result.flowId)
      const user = await User.findById(result.userId)

      const buffer = await generateVerificationReportPdf({
        flowTitle: flow?.title || "Vérification",
        userName: user?.name || "Utilisateur",
        date: result.createdAt ? new Date(result.createdAt as any) : new Date(),
        summary: result.summary || "",
      })

      pdfBase64 = buffer.toString("base64")

      const downloadUrl = `${env.NEXT_PUBLIC_APP_URL}/api/verification/report/${result._id.toString()}`
      await sendPdfUnlocked(paymentUser.email, paymentUser.name, downloadUrl)
    }

    logger.info("Payment approved", {
      paymentId: payment._id.toString(),
      userId: payment.userId.toString(),
      relatedTo: payment.relatedTo,
    })

    return NextResponse.json({ success: true, pdfBase64 })
  } catch (error) {
    return handleApiError(error)
  }
}
