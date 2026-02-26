import { NextResponse, type NextRequest } from "next/server"

import { ApiError, handleApiError } from "@/lib/apiError"
import { connectDB } from "@/lib/mongodb"
import { createManualPaymentSchema } from "@/lib/validations/payment"
import { requireUser } from "@/middlewares/authMiddleware"
import { Appointment, AvailableSlot, ManualPayment, VerificationFlow, VerificationResult } from "@/models"
import { extractLast4 } from "@/services/mvolaService"
import { saveProofImage } from "@/services/uploadService"
import mongoose from "mongoose"

export async function POST(req: NextRequest) {
  try {
    const payload = requireUser(req)

    const form = await req.formData()

    const relatedTo = String(form.get("relatedTo") || "")
    const relatedId = String(form.get("relatedId") || "")
    const amount = Number(form.get("amount"))
    const mvolaPhone = String(form.get("mvolaPhone") || "")
    const transactionRef = String(form.get("transactionRef") || "")
    const proofImage = form.get("proofImage")

    if (!(proofImage instanceof File)) {
      throw new ApiError(400, "proofImage is required")
    }

    await connectDB()

    if (relatedTo === "appointment") {
      const appointment = await Appointment.findById(relatedId)

      if (!appointment) {
        throw new ApiError(404, "Not found")
      }

      if (appointment.userId.toString() !== payload.userId) {
        throw new ApiError(403, "Forbidden")
      }

      if (!appointment.slotId) {
        throw new ApiError(400, "Missing slotId")
      }

      if (!Number.isNaN(amount) && amount !== appointment.price) {
        throw new ApiError(400, "Invalid amount")
      }

      const existingPayment = await ManualPayment.findOne({
        relatedTo: "appointment",
        relatedId: appointment._id,
      }).lean()

      if (existingPayment) {
        throw new ApiError(409, "Payment already submitted")
      }

      const parsed = createManualPaymentSchema.parse({
        relatedTo,
        relatedId,
        amount: appointment.price,
        mvolaPhone,
        transactionRef,
      })

      const proofImageUrl = await saveProofImage(proofImage)
      const last4UserId = extractLast4(payload.userId)

      const session = await mongoose.startSession()
      try {
        await session.withTransaction(async () => {
          const alreadyCounted = await ManualPayment.findOne({
            relatedTo: "appointment",
            relatedId: appointment._id,
          })
            .session(session)
            .lean()

          if (alreadyCounted) {
            throw new ApiError(409, "Payment already submitted")
          }

          const updatedSlot = await AvailableSlot.findOneAndUpdate(
            {
              _id: appointment.slotId,
              isActive: true,
              $expr: { $lt: ["$bookedSlots", "$maxSlots"] },
            },
            { $inc: { bookedSlots: 1 } },
            { new: true, session },
          )

          if (!updatedSlot) {
            throw new ApiError(409, "No slots available")
          }

          await Appointment.findByIdAndUpdate(
            appointment._id,
            { status: "waiting_payment_verification" },
            { session },
          )

          await ManualPayment.create(
            [
              {
                userId: payload.userId,
                relatedTo: parsed.relatedTo,
                relatedId: appointment._id,
                amount: parsed.amount,
                last4UserId,
                mvolaPhone: parsed.mvolaPhone,
                transactionRef: parsed.transactionRef,
                proofImage: proofImageUrl,
                status: "pending",
              },
            ],
            { session },
          )
        })
      } finally {
        session.endSession()
      }

      const payment = await ManualPayment.findOne({
        relatedTo: "appointment",
        relatedId: appointment._id,
      })

      return NextResponse.json({ payment }, { status: 201 })
    }

    if (relatedTo === "verification") {
      const verificationResult = await VerificationResult.findById(relatedId)

      if (!verificationResult) {
        throw new ApiError(404, "Not found")
      }

      if (verificationResult.userId.toString() !== payload.userId) {
        throw new ApiError(403, "Forbidden")
      }

      const flow = await VerificationFlow.findById(verificationResult.flowId)

      if (!flow) {
        throw new ApiError(400, "Invalid verification flow")
      }

      if (!Number.isNaN(amount) && amount !== flow.priceForDetailedReport) {
        throw new ApiError(400, "Invalid amount")
      }

      const existingPayment = await ManualPayment.findOne({
        relatedTo: "verification",
        relatedId: verificationResult._id,
      }).lean()

      if (existingPayment) {
        throw new ApiError(409, "Payment already submitted")
      }

      const parsed = createManualPaymentSchema.parse({
        relatedTo,
        relatedId,
        amount: flow.priceForDetailedReport,
        mvolaPhone,
        transactionRef,
      })

      const proofImageUrl = await saveProofImage(proofImage)
      const last4UserId = extractLast4(payload.userId)

      const payment = await ManualPayment.create({
        userId: payload.userId,
        relatedTo: parsed.relatedTo,
        relatedId: verificationResult._id,
        amount: parsed.amount,
        last4UserId,
        mvolaPhone: parsed.mvolaPhone,
        transactionRef: parsed.transactionRef,
        proofImage: proofImageUrl,
        status: "pending",
      })

      return NextResponse.json({ payment }, { status: 201 })
    }

    const parsed = createManualPaymentSchema.parse({
      relatedTo,
      relatedId,
      amount,
      mvolaPhone,
      transactionRef,
    })

    const proofImageUrl = await saveProofImage(proofImage)
    const last4UserId = extractLast4(payload.userId)

    const payment = await ManualPayment.create({
      userId: payload.userId,
      relatedTo: parsed.relatedTo,
      relatedId: parsed.relatedId,
      amount: parsed.amount,
      last4UserId,
      mvolaPhone: parsed.mvolaPhone,
      transactionRef: parsed.transactionRef,
      proofImage: proofImageUrl,
      status: "pending",
    })

    return NextResponse.json({ payment }, { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
