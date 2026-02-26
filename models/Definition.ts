import mongoose, { Schema } from "mongoose"

export interface IDefinition extends mongoose.Document {
  title: string
  content: string
}

const DefinitionSchema = new Schema<IDefinition>(
  {
    title: { type: String, required: true, unique: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
)

export const Definition =
  (mongoose.models.Definition as mongoose.Model<IDefinition>) ||
  mongoose.model<IDefinition>("Definition", DefinitionSchema)
