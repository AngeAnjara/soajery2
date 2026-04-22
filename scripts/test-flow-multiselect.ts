import assert from "node:assert/strict"

import type { FlowDefinition } from "@/types/flow"
import { getVisibleQuestionSequence } from "@/services/flowRunner"

const flow: FlowDefinition = {
  version: 1,
  status: "draft",
  startNodeId: "q1",
  nodes: [
    {
      id: "q1",
      type: "question",
      position: { x: 0, y: 0 },
      data: {
        label: "Select items",
        fieldKey: "items",
        inputType: "multi_select",
        options: ["a", "b"],
      },
    },
    {
      id: "d1",
      type: "decisionTree",
      position: { x: 200, y: 0 },
      data: { fieldKey: "items" },
    },
    {
      id: "q2",
      type: "question",
      position: { x: 400, y: 0 },
      data: {
        label: "detail",
        fieldKey: "detail",
        inputType: "text",
      },
    },
  ],
  edges: [
    { id: "e-q1-d1", source: "q1", target: "d1" },
    { id: "e-d1-a", source: "d1", target: "q2", branchKey: "a" },
    { id: "e-d1-b", source: "d1", target: "q2", branchKey: "b" },
  ],
}

const visible = getVisibleQuestionSequence(flow, { items: ["a", "b"] })

assert.equal(visible.length, 2)
assert.deepEqual(
  visible.map((q) => q.data.fieldKey).sort(),
  ["detail__items::a", "detail__items::b"],
)

console.log("ok - decision tree repeats downstream question per selected option")
