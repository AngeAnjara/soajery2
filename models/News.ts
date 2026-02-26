import mongoose, { Schema } from "mongoose"

export interface INews extends mongoose.Document {
  title: string
  description: string
  image?: string
  facebookUrl: string
}

const NewsSchema = new Schema<INews>(
  {
    title: { type: String, required: true },
    description: { type: String, required: true },
    image: { type: String },
    facebookUrl: { type: String, required: true },
  },
  { timestamps: true },
)

export const News =
  (mongoose.models.News as mongoose.Model<INews>) || mongoose.model<INews>("News", NewsSchema)
