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

const flowSchemaObject = z.object({
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
          inputType: z.enum(["boolean", "select", "multi_select", "text", "number"]),
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
          branches: z
            .array(
              z.object({
                key: z.string().min(1),
                logic: z.enum(["AND", "OR"]),
                rules: z.array(
                  z.object({
                    fieldKey: z.string().min(1),
                    operator: z.enum(["equals", "not_equals", "greater_than", "less_than", "includes"]),
                    value: z.string().min(1),
                  }),
                ),
              }),
            )
            .optional(),
          fallbackBranchKey: z.string().min(1).optional(),
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
      z.object({
        id: z.string().min(1),
        type: z.literal("alert"),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.object({
          text: z.string().min(1),
          color: z.enum(["red", "green"]).optional(),
        }),
      }),
    ]),
  ),
  edges: z.array(
    z.object({
      id: z.string().min(1),
      source: z.string().min(1),
      target: z.string().min(1),
      branchKey: z.string().min(1).optional(),
    }),
  ),
  startNodeId: z.string().min(1),
  version: z.number().optional(),
  status: z.enum(["draft", "published"]).optional(),
})

export const createFlowSchema = flowSchemaObject.superRefine((val, ctx) => {
  const nodes = Array.isArray(val.nodes) ? val.nodes : []
  const edges = Array.isArray(val.edges) ? val.edges : []

  const nodeTypeById = new Map<string, string>()
  nodes.forEach((n: any) => nodeTypeById.set(String(n.id), String(n.type)))

  const outgoingBySource = new Map<string, number>()
  const branchPairs = new Set<string>()

  for (const e of edges as any[]) {
    const source = String(e.source)
    const rawKey = typeof e.branchKey === "string" ? e.branchKey.trim() : ""
    const key = rawKey || "__default__"

    outgoingBySource.set(source, (outgoingBySource.get(source) || 0) + 1)

    const pair = `${source}::${key}`
    if (branchPairs.has(pair)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ambiguous routing: duplicate outgoing branch '${key === "__default__" ? "default" : key}' for source '${source}'.`,
        path: ["edges"],
      })
    } else {
      branchPairs.add(pair)
    }
  }

  for (const [source, count] of outgoingBySource.entries()) {
    const t = nodeTypeById.get(source)
    if (t === "question" || t === "action") {
      if (count > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid graph: node '${source}' of type '${t}' must have at most 1 outgoing edge (found ${count}).`,
          path: ["edges"],
        })
      }
    }
  }
})

export const patchFlowSchema = flowSchemaObject.partial().superRefine((val, ctx) => {
  const nodes = Array.isArray((val as any).nodes) ? (val as any).nodes : []
  const edges = Array.isArray((val as any).edges) ? (val as any).edges : []

  const nodeTypeById = new Map<string, string>()
  nodes.forEach((n: any) => nodeTypeById.set(String(n.id), String(n.type)))

  const outgoingBySource = new Map<string, number>()
  const branchPairs = new Set<string>()

  for (const e of edges as any[]) {
    const source = String(e.source)
    const rawKey = typeof e.branchKey === "string" ? e.branchKey.trim() : ""
    const key = rawKey || "__default__"

    outgoingBySource.set(source, (outgoingBySource.get(source) || 0) + 1)

    const pair = `${source}::${key}`
    if (branchPairs.has(pair)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Ambiguous routing: duplicate outgoing branch '${key === "__default__" ? "default" : key}' for source '${source}'.`,
        path: ["edges"],
      })
    } else {
      branchPairs.add(pair)
    }
  }

  for (const [source, count] of outgoingBySource.entries()) {
    const t = nodeTypeById.get(source)
    if (t === "question" || t === "action") {
      if (count > 1) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Invalid graph: node '${source}' of type '${t}' must have at most 1 outgoing edge (found ${count}).`,
          path: ["edges"],
        })
      }
    }
  }
})
