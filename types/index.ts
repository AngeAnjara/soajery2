export type LotissementDTO = {
  _id: string
  name: string
  description: string
  images: string[]
  location?: string
  googleMapLink?: string
}

export type DefinitionDTO = {
  _id: string
  title: string
  content: string
}

export type FAQDTO = {
  _id: string
  question: string
  answer: string
}

export type VideoDTO = {
  _id: string
  title: string
  thumbnail: string
  facebookUrl: string
}

export type NewsDTO = {
  _id: string
  title: string
  description: string
  image?: string
  facebookUrl: string
}

export type AvailableSlotDTO = {
  _id: string
  date: string
  maxSlots: number
  bookedSlots: number
  price: number
  isActive: boolean
}

export type AppointmentStatus =
  | "pending"
  | "waiting_payment_verification"
  | "paid"
  | "cancelled"

export type AppointmentDTO = {
  _id: string
  userId: string
  date: string
  status: AppointmentStatus
  price: number
  createdAt: string
}

export type ManualPaymentRelatedTo = "appointment" | "verification"
export type ManualPaymentStatus = "pending" | "approved" | "rejected"

export type ManualPaymentDTO = {
  _id: string
  userId: string
  relatedTo: ManualPaymentRelatedTo
  relatedId: string
  amount: number
  last4UserId: string
  mvolaPhone: string
  transactionRef: string
  proofImage: string
  status: ManualPaymentStatus
  createdAt: string
}

export type VerificationFlowDTO = {
  _id: string
  title: string
  description?: string
  priceForDetailedReport: number
  nodes: any[]
  edges: any[]
  version: number
  status: "draft" | "published"
  startNodeId: string
}

export type { FlowNode as FlowNodeDTO } from "@/types/flow"

export type FlowRunResultDTO = {
  resultId: string
  nextNodeId?: string
  actionType?: string
  prompt?: string
  aiAnalysis?: any
  resultType?: "result" | "alert"
  resultColor?: "red" | "green"
  resultTitle?: string
  resultDescription?: string
}
