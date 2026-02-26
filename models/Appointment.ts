import mongoose, { Schema } from "mongoose"

export type AppointmentStatus =
  | "pending"
  | "waiting_payment_verification"
  | "paid"
  | "cancelled"

export interface IAppointment extends mongoose.Document {
  userId: mongoose.Types.ObjectId
  slotId: mongoose.Types.ObjectId
  date: Date
  status: AppointmentStatus
  price: number
}

const AppointmentSchema = new Schema<IAppointment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "AvailableSlot", required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["pending", "waiting_payment_verification", "paid", "cancelled"],
      default: "pending",
    },
    price: { type: Number, required: true, min: 0 },
  },
  { timestamps: true },
)

export const Appointment =
  (mongoose.models.Appointment as mongoose.Model<IAppointment>) ||
  mongoose.model<IAppointment>("Appointment", AppointmentSchema)
