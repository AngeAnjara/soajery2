import mongoose, { Schema } from "mongoose"

export interface IUser extends mongoose.Document {
  name: string
  email: string
  password: string
  role: "admin" | "user"
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ["admin", "user"], default: "user" },
  },
  { timestamps: true },
)

export const User =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", UserSchema)
