import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { env } from "@/lib/env"
import { connectDB } from "@/lib/mongodb"
import { requireAdmin } from "@/middlewares/authMiddleware"
import { User, VerificationFlow, VerificationResult } from "@/models"
import { sendPdfUnlocked } from "@/services/emailService"
import { generateVerificationReportPdf } from "@/services/pdfService"
import { logger } from "@/utils/logger"

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    requireAdmin(req)
    await connectDB()

    const result = await VerificationResult.findById(id)

    if (!result) {
      throw new ApiError(404, "Not found")
    }

    if (result.status === "unlocked") {
      throw new ApiError(400, "Already unlocked")
    }

    result.status = "unlocked"
    await result.save()

    const [user, flow] = await Promise.all([
      User.findById(result.userId),
      VerificationFlow.findById(result.flowId),
    ])

    if (user) {
      await generateVerificationReportPdf({
        flowTitle: flow?.title || "Vérification",
        userName: user.name,
        date: result.createdAt ? new Date(result.createdAt as any) : new Date(),
        summary: result.summary || "",
      })

      const downloadUrl = `${env.NEXT_PUBLIC_APP_URL}/api/verification/report/${id}`
      await sendPdfUnlocked(user.email, user.name, downloadUrl)
    }

    logger.info("Verification unlocked", {
      resultId: id,
      userId: result.userId.toString(),
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
