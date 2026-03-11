import mongoose, { Schema } from "mongoose"

import type { FlowDefinition } from "@/types/flow"

export interface IVerificationFlow extends mongoose.Document {
  title: string
  description?: string
  priceForDetailedReport: number
  hidden?: boolean
  nodes: FlowDefinition["nodes"]
  edges: FlowDefinition["edges"]
  startNodeId: string
  version: number
  status: FlowDefinition["status"]
}

const VerificationFlowSchema = new Schema<IVerificationFlow>(
  {
    title: { type: String, required: true },
    description: { type: String },
    priceForDetailedReport: { type: Number, required: true, min: 0 },
    hidden: { type: Boolean, default: false },
    nodes: [{ type: Schema.Types.Mixed }],
    edges: [{ type: Schema.Types.Mixed }],
    startNodeId: { type: String, required: true },
    version: { type: Number, default: 1 },
    status: { type: String, enum: ["draft", "published"], default: "draft" },
  },
  { timestamps: true },
)

export const VerificationFlow =
  (mongoose.models.VerificationFlow as mongoose.Model<IVerificationFlow>) ||
  mongoose.model<IVerificationFlow>("VerificationFlow", VerificationFlowSchema)
