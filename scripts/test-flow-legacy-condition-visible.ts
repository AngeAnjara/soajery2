import assert from "node:assert/strict"

import { getVisibleQuestionSequence } from "@/services/flowRunner"
import type { FlowDefinition } from "@/types/flow"

function main() {
  const flow: any = {
    startNodeId: "q1",
    version: 1,
    status: "draft",
    nodes: [
      {
        id: "q1",
        type: "question",
        position: { x: 0, y: 0 },
        data: { label: "Q1", fieldKey: "a", inputType: "text" },
      },
      {
        id: "c1",
        type: "condition",
        position: { x: 0, y: 0 },
        data: {
          logic: "AND",
          rules: [{ fieldKey: "a", operator: "equals", value: "yes" }],
        },
      },
      {
        id: "q2",
        type: "question",
        position: { x: 0, y: 0 },
        data: { label: "Q2", fieldKey: "b", inputType: "text" },
      },
      {
        id: "q3",
        type: "question",
        position: { x: 0, y: 0 },
        data: { label: "Q3", fieldKey: "c", inputType: "text" },
      },
    ],
    edges: [
      { id: "e1", source: "q1", target: "c1" },
      // legacy edges use sourceHandle (true/false)
      { id: "e2", source: "c1", target: "q2", sourceHandle: "true" },
      { id: "e3", source: "c1", target: "q3", sourceHandle: "false" },
    ],
  } satisfies FlowDefinition

  // With answer provided, visible sequence should progress past condition and include downstream question
  const seqMatch = getVisibleQuestionSequence(flow, { a: "yes" })
  assert.deepEqual(
    seqMatch.map((q) => q.id),
    ["q1", "q2"],
  )

  const seqNoMatch = getVisibleQuestionSequence(flow, { a: "no" })
  assert.deepEqual(
    seqNoMatch.map((q) => q.id),
    ["q1", "q3"],
  )

  // eslint-disable-next-line no-console
  console.log("OK: legacy condition visible-question traversal works")
}

main()
