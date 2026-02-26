import mongoose, { Schema } from "mongoose"

export interface IFAQ extends mongoose.Document {
  question: string
  answer: string
}

const FAQSchema = new Schema<IFAQ>(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { timestamps: true },
)

export const FAQ =
  (mongoose.models.FAQ as mongoose.Model<IFAQ>) || mongoose.model<IFAQ>("FAQ", FAQSchema)
