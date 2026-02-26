import mongoose, { Schema } from "mongoose"

export interface ILotissement extends mongoose.Document {
  name: string
  description: string
  images: string[]
  location?: string
  googleMapLink?: string
}

const LotissementSchema = new Schema<ILotissement>(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    location: { type: String },
    googleMapLink: { type: String },
  },
  { timestamps: true },
)

export const Lotissement =
  (mongoose.models.Lotissement as mongoose.Model<ILotissement>) ||
  mongoose.model<ILotissement>("Lotissement", LotissementSchema)
