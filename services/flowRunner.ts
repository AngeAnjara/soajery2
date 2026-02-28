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

function edgeBranchKey(e: any) {
  const raw = typeof e?.branchKey === "string" ? e.branchKey : typeof e?.sourceHandle === "string" ? e.sourceHandle : ""
  return String(raw || "").trim()
}

function pickSingleOutgoingTarget(flow: FlowDefinition, sourceId: string) {
  const edges = getOutgoingEdges(flow, sourceId)
  if (edges.length !== 1) return undefined
  return edges[0]?.target
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
  const data: any = node.data || {}

  const branches = Array.isArray(data?.branches) ? data.branches : []

  if (!branches.length && Array.isArray(data?.rules)) {
    const rules = data.rules as ConditionRule[]
    const checks = rules.map((r) => evaluateRule(r, answers))
    const logic = String(data?.logic || "AND") as "AND" | "OR"
    const value = logic === "AND" ? checks.every(Boolean) : checks.some(Boolean)
    return value ? "true" : "false"
  }

  for (const b of branches) {
    const key = String(b?.key || "").trim()
    if (!key) continue

    const rules = Array.isArray(b?.rules) ? b.rules : []
    if (!rules.length) continue
    const checks = rules.map((r: ConditionRule) => evaluateRule(r, answers))
    const logic = String(b?.logic || "AND") as "AND" | "OR"
    const ok = logic === "AND" ? checks.every(Boolean) : checks.some(Boolean)
    if (ok) return key
  }

  const fallback = typeof data?.fallbackBranchKey === "string" ? data.fallbackBranchKey.trim() : ""
  return fallback || "default"
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
      const next = pickSingleOutgoingTarget(flow, node.id)
      if (!next) return { nextNodeId: node.id }
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      const branchKey = evaluateConditionNode(node, userAnswers)
      const edges = getOutgoingEdges(flow, node.id)
      const chosen =
        edges.find((e) => edgeBranchKey(e) === String(branchKey)) ||
        edges.find((e) => !edgeBranchKey(e))
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
        const next = pickSingleOutgoingTarget(flow, node.id)
        if (!next) return { actionType: "show_result", nextNodeId: node.id }

        const nextNode = getNode(flow, next)
        if (nextNode?.type === "result") {
          return { resultNodeId: nextNode.id, title: nextNode.data.title, description: nextNode.data.description }
        }

        currentNodeId = next
        continue
      }

      return { nextNodeId: nodeId }
    }

    if (node.type === "result") {
      return { resultNodeId: nodeId, title: node.data.title, description: node.data.description }
    }

    if (node.type === "alert") {
      return { resultNodeId: nodeId, title: "Avertissement", description: (node as any).data?.text || "" }
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
      const next = pickSingleOutgoingTarget(flow, node.id)
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      const edges = getOutgoingEdges(flow, node.id)
      const next = edges.find((e) => !edgeBranchKey(e))?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "action") {
      const next = pickSingleOutgoingTarget(flow, node.id)
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
  const data: any = node.data || {}
  const branches = Array.isArray(data?.branches) ? data.branches : []

  if (!branches.length && Array.isArray(data?.rules)) {
    const rules = data.rules as any[]
    if (!rules.length) return false
    return rules.every((r: any) => isAnswerProvided(answers[r.fieldKey]) && typeof r.value === "string" && r.value.trim() !== "")
  }

  const hasAnyRules = branches.some((b: any) => Array.isArray(b?.rules) && b.rules.length > 0)
  if (!hasAnyRules) {
    return true
  }

  return branches.some((b: any) => {
    const rules = Array.isArray(b?.rules) ? b.rules : []
    if (!rules.length) return false
    return rules.every((r: any) => isAnswerProvided(answers[r.fieldKey]) && typeof r.value === "string" && r.value.trim() !== "")
  })
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
      const next = pickSingleOutgoingTarget(flow, node.id)
      if (!next) break
      currentNodeId = next
      continue
    }

    if (node.type === "condition") {
      if (!canEvaluateCondition(node, answers)) {
        break
      }
      const branchKey = evaluateConditionNode(node, answers)
      const edges = getOutgoingEdges(flow, node.id)
      const chosen =
        edges.find((e) => edgeBranchKey(e) === String(branchKey)) ||
        edges.find((e) => !edgeBranchKey(e))
      const next = chosen?.target
      if (!next) break
      currentNodeId = next
      continue
    }

    break
  }

  return ordered
}
