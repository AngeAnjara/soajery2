import { z } from "zod"

export const createManualPaymentSchema = z.object({
  relatedTo: z.enum(["appointment", "verification"]),
  relatedId: z.string().min(1),
  amount: z.number().positive(),
  mvolaPhone: z.string().regex(/^03[2-4]\d{7}$/),
  transactionRef: z.string().min(1),
})
