import { z } from "zod"

export const evaluateVerificationSchema = z.object({
  flowId: z.string().min(1),
  answers: z.record(
    z.string(),
    z.union([z.string(), z.array(z.string()), z.boolean(), z.number(), z.record(z.string(), z.number())]),
  ),
})
