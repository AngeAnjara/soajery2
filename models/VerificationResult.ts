import mongoose, { Schema } from "mongoose"

export type VerificationResultStatus = "pending" | "unlocked"

export interface IVerificationResult extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  flowId: mongoose.Types.ObjectId
  answers: Record<string, string | string[] | boolean | number>
  createdAt?: Date
  updatedAt?: Date
  aiAnalysis?: {
    summary: string
    analysis: string
    recommendation: string
    confidence: string
  }
  resultNodeId?: string
  summary: string
  status: VerificationResultStatus
}

const VerificationResultSchema = new Schema<IVerificationResult>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    flowId: { type: Schema.Types.ObjectId, ref: "VerificationFlow", required: true },
    answers: { type: Schema.Types.Mixed, required: true },
    aiAnalysis: { type: Schema.Types.Mixed, required: false },
    resultNodeId: { type: String, required: false },
    summary: { type: String },
    status: { type: String, enum: ["pending", "unlocked"], default: "pending" },
  },
  { timestamps: true },
)

export const VerificationResult =
  (mongoose.models.VerificationResult as mongoose.Model<IVerificationResult>) ||
  mongoose.model<IVerificationResult>("VerificationResult", VerificationResultSchema)
