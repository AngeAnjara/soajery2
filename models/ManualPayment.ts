import mongoose, { Schema } from "mongoose"

export type ManualPaymentRelatedTo = "appointment" | "verification"
export type ManualPaymentStatus = "pending" | "approved" | "rejected"

export interface IManualPayment extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  relatedTo: ManualPaymentRelatedTo
  relatedId: mongoose.Types.ObjectId
  amount: number
  last4UserId: string
  mvolaPhone: string
  transactionRef: string
  proofImage: string
  status: ManualPaymentStatus
}

const ManualPaymentSchema = new Schema<IManualPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    relatedTo: { type: String, enum: ["appointment", "verification"], required: true },
    relatedId: { type: Schema.Types.ObjectId, required: true },
    amount: { type: Number, required: true, min: 0 },
    last4UserId: { type: String, required: true, minlength: 4, maxlength: 4 },
    mvolaPhone: { type: String, required: true },
    transactionRef: { type: String, required: true },
    proofImage: { type: String, required: true },
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true },
)

export const ManualPayment =
  (mongoose.models.ManualPayment as mongoose.Model<IManualPayment>) ||
  mongoose.model<IManualPayment>("ManualPayment", ManualPaymentSchema)
