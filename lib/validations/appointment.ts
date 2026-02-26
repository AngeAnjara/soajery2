import { z } from "zod"

export const createAppointmentSchema = z.object({
  slotId: z.string(),
  date: z.string().datetime(),
  price: z.number().positive(),
})

export const cancelAppointmentSchema = z.object({
  reason: z.string().optional(),
})
