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

function listSelectedOptionIds(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((v) => String(v)).filter((v) => v.trim() !== "")
  }
  if (value && typeof value === "object") {
    return Object.entries(value as any)
      .filter(([, v]) => typeof v === "number" && v > 0)
      .map(([k]) => String(k))
      .filter((v) => v.trim() !== "")
  }
  if (typeof value === "string" && value.trim() !== "") {
    return [value.trim()]
  }
  return []
}

function pickDefaultEdgeTarget(flow: FlowDefinition, sourceId: string) {
  const edges = getOutgoingEdges(flow, sourceId)
  const chosen = edges.find((e) => !edgeBranchKey(e))
  return chosen?.target
}

function traverseActiveQuestions(flow: FlowDefinition, answers: UserAnswers) {
  const activeQuestions: Extract<FlowNode, { type: "question" }>[] = []
  const pendingUploadNodes: Extract<FlowNode, { type: "upload" }>[] = []
  const queue: string[] = [String(flow.startNodeId || "")]
  const visited = new Set<string>()
  let firstTerminal: FlowRunResult | null = null

  const isUploadSatisfied = (node: Extract<FlowNode, { type: "upload" }>) => {
    const key = node.data.fieldKey
    const maxFilesRaw = (node.data as any)?.maxFiles
    const maxFiles = typeof maxFilesRaw === "number" && Number.isFinite(maxFilesRaw) && maxFilesRaw > 0 ? Math.floor(maxFilesRaw) : 1

    const v: any = (answers as any)?.[key]
    if (maxFiles <= 1) return isAnswerProvided(v)

    if (Array.isArray(v)) {
      const urls = v.map((x) => (typeof x === "string" ? x.trim() : "")).filter((x) => x)
      return urls.length >= maxFiles
    }

    if (typeof v === "string") {
      return v.trim() !== "" && maxFiles <= 1
    }

    return false
  }

  while (queue.length) {
    const currentNodeId = String(queue.shift() || "")
    if (!currentNodeId) continue
    if (visited.has(currentNodeId)) continue
    visited.add(currentNodeId)

    const node = getNode(flow, currentNodeId)
    if (!node) continue

    if (node.type === "question") {
      const key = node.data.fieldKey
      if (!isAnswerProvided(answers[key])) {
        activeQuestions.push(node)
        continue
      }
      const next = pickSingleOutgoingTarget(flow, node.id)
      if (next) queue.push(next)
      continue
    }

    if (node.type === "upload") {
      if (!isUploadSatisfied(node)) {
        pendingUploadNodes.push(node)
        continue
      }
      const next = pickSingleOutgoingTarget(flow, node.id)
      if (next) queue.push(next)
      continue
    }

    if (node.type === "openaiVision") {
      const outputFieldKey = String((node as any)?.data?.outputFieldKey || "")
      if (outputFieldKey && isAnswerProvided((answers as any)?.[outputFieldKey])) {
        const next = pickSingleOutgoingTarget(flow, node.id)
        if (next) queue.push(next)
        continue
      }

      if (!firstTerminal) {
        firstTerminal = {
          actionType: "call_ai",
          pendingVisionNodeId: node.id,
          visionModel: String((node as any)?.data?.model || ""),
          visionPrompt: String((node as any)?.data?.prompt || ""),
          visionOutputFieldKey: outputFieldKey,
        }
      }
      continue
    }

    if (node.type === "condition") {
      if (!canEvaluateCondition(node, answers)) {
        continue
      }
      const branchKey = evaluateConditionNode(node, answers)
      const edges = getOutgoingEdges(flow, node.id)
      const chosen = edges.find((e) => edgeBranchKey(e) === String(branchKey)) || edges.find((e) => !edgeBranchKey(e))
      if (chosen?.target) queue.push(chosen.target)
      continue
    }

    if (node.type === "decisionTree") {
      const fieldKey = String((node as any)?.data?.fieldKey || "")
      const selected = listSelectedOptionIds((answers as any)?.[fieldKey])
      const edges = getOutgoingEdges(flow, node.id)

      const targets: string[] = []
      const seenTargets = new Set<string>()

      for (const optId of selected) {
        const match = edges.find((e) => edgeBranchKey(e) === String(optId))
        const t = match?.target
        if (t && !seenTargets.has(String(t))) {
          targets.push(String(t))
          seenTargets.add(String(t))
        }
      }

      if (!targets.length) {
        const def = pickDefaultEdgeTarget(flow, node.id)
        if (def && !seenTargets.has(String(def))) {
          targets.push(String(def))
          seenTargets.add(String(def))
        }
      }

      targets.forEach((t) => queue.push(t))
      continue
    }

    if (node.type === "flow") {
      const target = (node as any)?.data?.target
      if (!firstTerminal && target?.flowId) {
        firstTerminal = {
          actionType: "transition",
          transition: target,
          transitionFromNodeId: node.id,
          transitionKind: "flow_node",
        }
      }
      continue
    }

    if (node.type === "action") {
      if (!firstTerminal && node.data.actionType === "call_ai") {
        const prompt = generatePrompt(answers, flow.nodes)
        firstTerminal = { actionType: "call_ai", prompt }
      }
      if (!firstTerminal && node.data.actionType === "redirect") {
        const redirect = (node as any)?.data?.payload?.redirect
        firstTerminal = { actionType: "redirect", redirect }
      }
      if (node.data.actionType === "show_result") {
        const next = pickSingleOutgoingTarget(flow, node.id)
        if (!next) continue

        const nextNode = getNode(flow, next)
        if (!nextNode) continue

        if (!firstTerminal && nextNode.type === "result") {
          firstTerminal = {
            resultNodeId: nextNode.id,
            resultType: "result",
            title: nextNode.data.title,
            description: nextNode.data.description,
          }
        }

        if (!firstTerminal && nextNode.type === "alert") {
          const color = (nextNode as any).data?.color === "green" ? "green" : "red"
          firstTerminal = {
            resultNodeId: nextNode.id,
            resultType: "alert",
            resultColor: color,
            title: "Avertissement",
            description: (nextNode as any).data?.text || "",
          }
        }

        if (nextNode.type !== "result" && nextNode.type !== "alert") {
          queue.push(next)
        }
      }
      continue
    }

    if (!firstTerminal && node.type === "result") {
      firstTerminal = { resultNodeId: node.id, resultType: "result", title: node.data.title, description: node.data.description }
      continue
    }

    if (!firstTerminal && node.type === "alert") {
      const color = (node as any).data?.color === "green" ? "green" : "red"
      firstTerminal = {
        resultNodeId: node.id,
        resultType: "alert",
        resultColor: color,
        title: "Avertissement",
        description: (node as any).data?.text || "",
      }
      continue
    }
  }

  return { activeQuestions, pendingUploadNodes, firstTerminal }
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

  const asQuantityMap = (v: unknown): Record<string, number> | undefined => {
    if (!v || typeof v !== "object" || Array.isArray(v)) return undefined
    const entries = Object.entries(v as any)
    if (!entries.length) return undefined
    const out: Record<string, number> = {}
    for (const [k, val] of entries) {
      const key = String(k)
      const n = typeof val === "number" && Number.isFinite(val) ? val : Number(val)
      if (!Number.isFinite(n)) continue
      out[key] = Math.max(0, Math.floor(n))
    }
    return out
  }

  const quantity = asQuantityMap(actual)

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
      if (quantity) {
        const key = String(expectedRaw || "")
        return (quantity[key] || 0) > 0
      }
      if (Array.isArray(actual)) return actual.includes(expectedRaw)
      return String(actual ?? "") === expectedRaw
    }
    case "not_equals": {
      if (expectedBool !== undefined && actualBool !== undefined) return actualBool !== expectedBool
      if (quantity) {
        const key = String(expectedRaw || "")
        return (quantity[key] || 0) <= 0
      }
      if (Array.isArray(actual)) return !actual.includes(expectedRaw)
      return String(actual ?? "") !== expectedRaw
    }
    case "includes": {
      if (expectedBool !== undefined && actualBool !== undefined) return actualBool === expectedBool
      if (quantity) {
        const key = String(expectedRaw || "")
        return (quantity[key] || 0) > 0
      }
      if (Array.isArray(actual)) return actual.includes(expectedRaw)
      if (typeof actual === "string") return actual.includes(expectedRaw)
      return false
    }
    case "greater_than": {
      const a = quantity ? coerceToNumber(quantity[String(expectedRaw || "")]) : coerceToNumber(actual)
      const b = coerceToNumber(expectedRaw)
      if (a === undefined || b === undefined) return false
      return a > b
    }
    case "less_than": {
      const a = quantity ? coerceToNumber(quantity[String(expectedRaw || "")]) : coerceToNumber(actual)
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
  pendingUploadNodeId?: string
  pendingVisionNodeId?: string
  visionModel?: string
  visionPrompt?: string
  visionOutputFieldKey?: string
  visionResult?: Record<string, unknown>
  actionType?: "call_ai" | "show_result" | "redirect" | "transition"
  prompt?: string
  redirect?: any
  transition?: any
  transitionFromNodeId?: string
  transitionKind?: "flow_node"
  resultNodeId?: string
  resultType?: "result" | "alert"
  resultColor?: "red" | "green"
  title?: string
  description?: string
}

export type FlowPreRunResult = FlowRunResult & {
  blockedOnQuestionId?: string
  pendingUploadNodeId?: string
}

export type TransitionLineageHop = {
  fromFlowId: string
  toFlowId: string
  kind: "redirect" | "flow_node"
  fromNodeId?: string
}

export type ChainedFlowRunResult = {
  flowId: string
  run: FlowRunResult
  lineage: TransitionLineageHop[]
}

export async function runChainedFlows(opts: {
  startFlowId: string
  startFlow: FlowDefinition
  answers: UserAnswers
  getFlowById: (flowId: string) => Promise<FlowDefinition | null>
  hopLimit?: number
}): Promise<ChainedFlowRunResult> {
  const hopLimit = typeof opts.hopLimit === "number" && opts.hopLimit > 0 ? opts.hopLimit : 10

  let currentFlowId = String(opts.startFlowId)
  let currentFlow = opts.startFlow
  const lineage: TransitionLineageHop[] = []

  const visited = new Set<string>()
  let hops = 0

  while (true) {
    if (hops > hopLimit) {
      return { flowId: currentFlowId, run: { nextNodeId: currentFlow.startNodeId }, lineage }
    }

    const visitKey = `${currentFlowId}::${String(currentFlow.startNodeId || "")}`
    if (visited.has(visitKey)) {
      return { flowId: currentFlowId, run: { nextNodeId: currentFlow.startNodeId }, lineage }
    }
    visited.add(visitKey)

    const run = runFlow(currentFlow, opts.answers)

    if (run.actionType !== "transition" || !run.transition?.flowId) {
      return { flowId: currentFlowId, run, lineage }
    }

    const targetFlowId = String(run.transition.flowId)
    lineage.push({
      fromFlowId: currentFlowId,
      toFlowId: targetFlowId,
      kind: run.transitionKind || "flow_node",
      fromNodeId: run.transitionFromNodeId,
    })

    const nextFlow = await opts.getFlowById(targetFlowId)
    if (!nextFlow) {
      return { flowId: currentFlowId, run, lineage }
    }

    const entry = run.transition?.entry
    const startNodeId =
      entry && typeof entry === "object" && entry.type === "node" && typeof (entry as any).nodeId === "string" && String((entry as any).nodeId).trim() !== ""
        ? String((entry as any).nodeId)
        : String(nextFlow.startNodeId || "")

    currentFlowId = targetFlowId
    currentFlow = { ...nextFlow, startNodeId }
    hops += 1
  }
}

export function runFlow(flow: FlowDefinition, userAnswers: UserAnswers): FlowRunResult {
  const t = traverseActiveQuestions(flow, userAnswers)
  if (t.activeQuestions.length) {
    return { nextNodeId: t.activeQuestions[0]?.id }
  }
  if (t.pendingUploadNodes.length) {
    const id = t.pendingUploadNodes[0]?.id
    return { nextNodeId: id, pendingUploadNodeId: id }
  }
  return t.firstTerminal || {}
}

export function preRunFlow(flow: FlowDefinition, userAnswers: UserAnswers): FlowPreRunResult {
  const t = traverseActiveQuestions(flow, userAnswers)
  if (t.activeQuestions.length) {
    const id = t.activeQuestions[0]?.id
    return { nextNodeId: id, blockedOnQuestionId: id }
  }
  if (t.pendingUploadNodes.length) {
    const id = t.pendingUploadNodes[0]?.id
    return { nextNodeId: id, pendingUploadNodeId: id }
  }
  return (t.firstTerminal || {}) as any
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

    if (node.type === "upload") {
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
  if (typeof value === "object") {
    const values = Object.values(value as any)
    if (!values.length) return false
    if (values.some((v) => typeof v === "number" && v > 0)) return true
    return true
  }
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
  const t = traverseActiveQuestions(flow, answers)
  return t.activeQuestions
}
