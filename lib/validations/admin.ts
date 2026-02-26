import { z } from "zod"

export const createSlotSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  maxSlots: z.number().int().positive(),
  price: z.number().min(0),
})

export const updateSlotSchema = createSlotSchema.partial().extend({
  isActive: z.boolean().optional(),
})

export const createLotissementSchema = z.object({
  name: z.string().min(1),
  description: z.string().min(1),
  location: z.string().min(1),
  googleMapLink: z.string().min(1),
  images: z.array(z.string().min(1)),
})

export const createFaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
})

export const createDefinitionSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
})

export const createVideoSchema = z.object({
  title: z.string().min(1),
  thumbnail: z.string().min(1),
  facebookUrl: z.string().min(1),
})

export const createNewsSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  image: z.string().min(1),
  facebookUrl: z.string().min(1),
})

export const createFlowSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  priceForDetailedReport: z.number(),
  nodes: z.array(
    z.discriminatedUnion("type", [
      z.object({
        id: z.string().min(1),
        type: z.literal("question"),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
          label: z.string().min(1),
          fieldKey: z.string().min(1),
          inputType: z.enum(["boolean", "select", "text", "number"]),
          options: z.array(z.string()).optional(),
          aiMetadata: z
            .object({
              tag: z.string(),
              weight: z.number(),
              includeInPrompt: z.boolean(),
            })
            .optional(),
        }),
      }),
      z.object({
        id: z.string().min(1),
        type: z.literal("condition"),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
          logic: z.enum(["AND", "OR"]),
          rules: z.array(
            z.object({
              fieldKey: z.string().min(1),
              operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "includes"]),
              value: z.string().min(1),
            }),
          ),
        }),
      }),
      z.object({
        id: z.string().min(1),
        type: z.literal("action"),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
          actionType: z.enum(["call_ai", "show_result", "redirect"]),
          payload: z.record(z.any()).optional(),
        }),
      }),
      z.object({
        id: z.string().min(1),
        type: z.literal("result"),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
          title: z.string().min(1),
          description: z.string(),
        }),
      }),
    ]),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      sourceHandle: z.enum(["true", "false"]).optional(),
    }),
  ),
  startNodeId: z.string().min(1),
  version: z.number().optional(),
  status: z.enum(["draft", "published"]).optional(),
})
