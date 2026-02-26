import mongoose, { Schema } from "mongoose"

export interface IVideo extends mongoose.Document {
  title: string
  thumbnail: string
  facebookUrl: string
}

const VideoSchema = new Schema<IVideo>(
  {
    title: { type: String, required: true },
    thumbnail: { type: String, required: true },
    facebookUrl: { type: String, required: true },
  },
  { timestamps: true },
)

export const Video =
  (mongoose.models.Video as mongoose.Model<IVideo>) || mongoose.model<IVideo>("Video", VideoSchema)
