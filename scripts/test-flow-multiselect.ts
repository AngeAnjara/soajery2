import assert from "node:assert/strict"

import type { FlowDefinition } from "@/types/flow"
import { getVisibleQuestionSequence, runFlow } from "@/services/flowRunner"

const flowRepeatQuestion: FlowDefinition = {
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

const visible = getVisibleQuestionSequence(flowRepeatQuestion, { items: ["a", "b"] })
assert.equal(visible.length, 2)
assert.deepEqual(
  visible.map((q) => q.data.fieldKey).sort(),
  ["detail__items::a", "detail__items::b"],
)

const flowConditionAfterDecisionTree: FlowDefinition = {
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
    { id: "d1", type: "decisionTree", position: { x: 200, y: 0 }, data: { fieldKey: "items" } },
    {
      id: "c1",
      type: "condition",
      position: { x: 400, y: 0 },
      data: {
        branches: [
          {
            key: "yes",
            logic: "AND",
            rules: [{ fieldKey: "items", operator: "includes", value: "a" }],
          },
        ],
        fallbackBranchKey: "default",
      },
    },
    {
      id: "flow1",
      type: "flow",
      position: { x: 600, y: 0 },
      data: { target: { flowId: "next-flow", entry: { type: "start" } } },
    },
  ],
  edges: [
    { id: "e-q1-d1", source: "q1", target: "d1" },
    { id: "e-d1-a", source: "d1", target: "c1", branchKey: "a" },
    { id: "e-c1-yes", source: "c1", target: "flow1", branchKey: "yes" },
  ],
}

const run = runFlow(flowConditionAfterDecisionTree, { items: ["a"] })
assert.equal(run.actionType, "transition")
assert.equal(run.transition?.flowId, "next-flow")



const flowFallbackConditionAfterDecisionTree: FlowDefinition = {
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
        options: ["a"],
      },
    },
    { id: "d1", type: "decisionTree", position: { x: 200, y: 0 }, data: { fieldKey: "items" } },
    {
      id: "c1",
      type: "condition",
      position: { x: 400, y: 0 },
      data: {
        branches: [],
        fallbackBranchKey: "default",
      },
    },
    {
      id: "flow1",
      type: "flow",
      position: { x: 600, y: 0 },
      data: { target: { flowId: "fallback-flow", entry: { type: "start" } } },
    },
  ],
  edges: [
    { id: "e-q1-d1", source: "q1", target: "d1" },
    { id: "e-d1-a", source: "d1", target: "c1", branchKey: "a" },
    { id: "e-c1-default", source: "c1", target: "flow1", branchKey: "default" },
  ],
}

const fallbackRun = runFlow(flowFallbackConditionAfterDecisionTree, { items: ["a"] })
assert.equal(fallbackRun.actionType, "transition")
assert.equal(fallbackRun.transition?.flowId, "fallback-flow")

console.log("ok - decision tree repeats question and preserves downstream flow/action visibility")
