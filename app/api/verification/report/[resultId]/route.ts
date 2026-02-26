import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { requireUser } from "@/middlewares/authMiddleware"
import { User, VerificationFlow, VerificationResult } from "@/models"
import { generateVerificationReportPdf } from "@/services/pdfService"

export async function GET(req: Request, { params }: { params: Promise<{ resultId: string }> }) {
  try {
    const { resultId } = await params
    const anyReq = req as any
    const payload = requireUser(anyReq)

    await connectDB()

    const result = await VerificationResult.findById(resultId)

    if (!result) {
      throw new ApiError(404, "Not found")
    }

    if (result.userId.toString() !== payload.userId) {
      throw new ApiError(403, "Forbidden")
    }

    const flow = await VerificationFlow.findById(result.flowId)
    const user = await User.findById(result.userId)

    const buffer = await generateVerificationReportPdf({
      flowTitle: flow?.title || "Vérification",
      userName: user?.name || "Utilisateur",
      date: result.createdAt ? new Date(result.createdAt as any) : new Date(),
      summary: result.summary || "",
    })

    const body = new Uint8Array(buffer)

    return new Response(body, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": "attachment; filename=rapport-verification.pdf",
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}
