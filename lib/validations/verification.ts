import { z } from "zod"

const jsonValue: z.ZodType<unknown> = z.lazy(() =>
  z.union([z.string(), z.number(), z.boolean(), z.null(), z.array(jsonValue), z.record(z.string(), jsonValue)]),
)

export const evaluateVerificationSchema = z.object({
  flowId: z.string().min(1),
  answers: z.record(z.string(), jsonValue),
})
