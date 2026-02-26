import type {
  ConditionRule,
  FlowDefinition,
  FlowEdge,
  FlowNode,
  UserAnswers,
} from "@/types/flow"

import { generatePrompt } from "@/services/aiService"

function getNode(flow: FlowDefinition, nodeId: string) {
  return flow.nodes.find((n) => n.id === nodeId)
}

function getOutgoingEdges(flow: FlowDefinition, sourceId: string) {
  return flow.edges.filter((e) => e.source === sourceId)
}

function coerceToNumber(value: unknown) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value)
    if (!Number.isNaN(n)) return n
  }
  return undefined
}

export function evaluateRule(rule: ConditionRule, answers: UserAnswers) {
  const actual = answers[rule.fieldKey]
  const expectedRaw = rule.value

  const normalizeBooleanLike = (v: unknown): boolean | undefined => {
    if (typeof v === "boolean") return v
    if (typeof v === "string") {
      const s = v.trim().toLowerCase()
      if (s === "true" || s === "vrai" || s === "oui" || s === "yes") return true
      if (s === "false" || s === "faux" || s === "non" || s === "no") return false
    }
    return undefined
  }

  const expectedBool = normalizeBooleanLike(expectedRaw)
  const actualBool = normalizeBooleanLike(actual)

  switch (rule.operator) {
    case "equals": {
      if (expectedBool !== undefined && actualBool !== undefined) return actualBool === expectedBool
      if (Array.isArray(actual)) return actual.includes(expectedRaw)
      return String(actual ?? "") === expectedRaw
    }
    case "not_equals": {
      if (expectedBool !== undefined && actualBool !== undefined) return actualBool !== expectedBool
      if (Array.isArray(actual)) return !actual.includes(expectedRaw)
      return String(actual ?? "") !== expectedRaw
    }
    case "includes": {
      if (expectedBool !== undefined && actualBool !== undefined) return actualBool === expectedBool
      if (Array.isArray(actual)) return actual.includes(expectedRaw)
      if (typeof actual === "string") return actual.includes(expectedRaw)
      return false
    }
    case "greater_than": {
      const a = coerceToNumber(actual)
      const b = coerceToNumber(expectedRaw)
      if (a === undefined || b === undefined) return false
      return a > b
    }
    case "less_than": {
      const a = coerceToNumber(actual)
      const b = coerceToNumber(expectedRaw)
      if (a === undefined || b === undefined) return false
      return a < b
    }
    default:
      return false
  }
}

export function evaluateConditionNode(node: Extract<FlowNode, { type: "condition" }>, answers: UserAnswers) {
  const rules = Array.isArray(node.data?.rules) ? node.data.rules : []
  const checks = rules.map((r) => evaluateRule(r, answers))

  if (node.data.logic === "AND") {
    return checks.every(Boolean)
  }

  return checks.some(Boolean)
}

export type FlowRunResult = {
  nextNodeId?: string
  actionType?: "call_ai" | "show_result" | "redirect"
  prompt?: string
  resultNodeId?: string
  title?: string
  description?: string
}

export function runFlow(flow: FlowDefinition, userAnswers: UserAnswers): FlowRunResult {
  let currentNodeId = flow.startNodeId
  const visited = new Set<string>()

  while (currentNodeId) {
    if (visited.has(currentNodeId)) {
      return { nextNodeId: currentNodeId }
    }
    visited.add(currentNodeId)

    const node = getNode(flow, currentNodeId)
    if (!node) {
      return { nextNodeId: currentNodeId }
    }

    const nodeId = node.id

    if (node.type === "question") {
      const edges = getOutgoingEdges(flow, node.id)
      const next = edges[0]?.target
      if (!next) return { nextNodeId: node.id }
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      const value = evaluateConditionNode(node, userAnswers)
      const edges = getOutgoingEdges(flow, node.id)
      const chosen = edges.find((e) => e.sourceHandle === String(value) as FlowEdge["sourceHandle"]) || edges.find((e) => !e.sourceHandle)
      if (!chosen?.target) return { nextNodeId: node.id }
      currentNodeId = chosen.target
      continue
    }

    if (node.type === "action") {
      if (node.data.actionType === "call_ai") {
        const prompt = generatePrompt(userAnswers, flow.nodes)
        return { actionType: "call_ai", prompt }
      }

      if (node.data.actionType === "redirect") {
        return { actionType: "redirect" }
      }

      if (node.data.actionType === "show_result") {
        return { actionType: "show_result" }
      }

      return { nextNodeId: nodeId }
    }

    if (node.type === "result") {
      return { resultNodeId: nodeId, title: node.data.title, description: node.data.description }
    }

    return { nextNodeId: nodeId }
  }

  return {}
}

export function getQuestionSequence(flow: FlowDefinition) {
  const ordered: Extract<FlowNode, { type: "question" }>[] = []
  let currentNodeId = flow.startNodeId
  const visited = new Set<string>()

  while (currentNodeId) {
    if (visited.has(currentNodeId)) break
    visited.add(currentNodeId)

    const node = getNode(flow, currentNodeId)
    if (!node) break

    if (node.type === "question") {
      ordered.push(node)
      const next = getOutgoingEdges(flow, node.id)[0]?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      const edges = getOutgoingEdges(flow, node.id)
      const next = edges[0]?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "action") {
      const next = getOutgoingEdges(flow, node.id)[0]?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "result") {
      break
    }

    break
  }

  return ordered
}

function isAnswerProvided(value: unknown) {
  if (value === undefined || value === null) return false
  if (typeof value === "string") return value.trim() !== ""
  if (typeof value === "number") return true
  if (typeof value === "boolean") return true
  if (Array.isArray(value)) return value.length > 0
  return false
}

function canEvaluateCondition(node: Extract<FlowNode, { type: "condition" }>, answers: UserAnswers) {
  const rules = Array.isArray(node.data?.rules) ? node.data.rules : []
  if (!rules.length) return false
  return rules.every((r) => isAnswerProvided(answers[r.fieldKey]) && typeof r.value === "string" && r.value.trim() !== "")
}

export function getVisibleQuestionSequence(flow: FlowDefinition, answers: UserAnswers) {
  const ordered: Extract<FlowNode, { type: "question" }>[] = []
  let currentNodeId = flow.startNodeId
  const visited = new Set<string>()

  while (currentNodeId) {
    if (visited.has(currentNodeId)) break
    visited.add(currentNodeId)

    const node = getNode(flow, currentNodeId)
    if (!node) break

    if (node.type === "question") {
      ordered.push(node)
      const key = node.data.fieldKey
      if (!isAnswerProvided(answers[key])) {
        break
      }
      const next = getOutgoingEdges(flow, node.id)[0]?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      if (!canEvaluateCondition(node, answers)) {
        break
      }
      const value = evaluateConditionNode(node, answers)
      const edges = getOutgoingEdges(flow, node.id)
      const chosen =
        edges.find((e) => e.sourceHandle === (String(value) as FlowEdge["sourceHandle"])) ||
        edges.find((e) => !e.sourceHandle)
      const next = chosen?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    break
  }

  return ordered
}
