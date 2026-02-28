import assert from "node:assert/strict"

import { createFlowSchema, patchFlowSchema } from "@/lib/validations/admin"

function testCreateFlowAllowsMultiSelect() {
  const payload = {
    title: "Flow multi",
    description: "",
    priceForDetailedReport: 1000,
    startNodeId: "q1",
    version: 1,
    status: "draft",
    nodes: [
      {
        id: "q1",
        type: "question",
        position: { x: 10, y: 10 },
        data: {
          label: "Choisis",
          fieldKey: "choices",
          inputType: "multi_select",
          options: ["Option A", "Option B", "Option C", "Option D"],
        },
      },
    ],
    edges: [],
  }

  const parsed = createFlowSchema.parse(payload)
  assert.equal(parsed.nodes[0].type, "question")
  assert.equal((parsed.nodes[0] as any).data.inputType, "multi_select")
  assert.deepEqual((parsed.nodes[0] as any).data.options, ["Option A", "Option B", "Option C", "Option D"])
}

function testPatchFlowAllowsMultiSelect() {
  const payload = {
    nodes: [
      {
        id: "q1",
        type: "question",
        position: { x: 10, y: 10 },
        data: {
          label: "Choisis",
          fieldKey: "choices",
          inputType: "multi_select",
          options: ["A", "B", "C"],
        },
      },
    ],
  }

  const parsed = patchFlowSchema.parse(payload)
  assert.ok(Array.isArray(parsed.nodes))
  assert.equal((parsed.nodes?.[0] as any)?.data?.inputType, "multi_select")
}

function main() {
  testCreateFlowAllowsMultiSelect()
  testPatchFlowAllowsMultiSelect()
  // eslint-disable-next-line no-console
  console.log("OK: flow validation accepts multi_select")
}

main()
