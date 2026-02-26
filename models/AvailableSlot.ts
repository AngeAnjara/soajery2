import mongoose, { Schema } from "mongoose"

export interface IAvailableSlot extends mongoose.Document {
  date: Date
  maxSlots: number
  bookedSlots: number
  price: number
  isActive: boolean
}

const AvailableSlotSchema = new Schema<IAvailableSlot>(
  {
    date: { type: Date, required: true, unique: true },
    maxSlots: { type: Number, required: true, min: 1 },
    bookedSlots: { type: Number, default: 0 },
    price: { type: Number, required: true, min: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

export const AvailableSlot =
  (mongoose.models.AvailableSlot as mongoose.Model<IAvailableSlot>) ||
  mongoose.model<IAvailableSlot>("AvailableSlot", AvailableSlotSchema)
