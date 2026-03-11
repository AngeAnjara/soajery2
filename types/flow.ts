export type AiMetadata = {
  tag: string
  weight: number
  includeInPrompt: boolean
}

export type QuestionNodeData = {
  label: string
  fieldKey: string
  inputType: "boolean" | "select" | "multi_select" | "text" | "number"
  allowQuantity?: boolean
  options?: string[] | MultiSelectOption[]
  aiMetadata?: AiMetadata
}

export type MultiSelectOption = {
  id: string
  label: string
  maxCount?: number
}

export type ConditionRule = {
  fieldKey: string
  operator: "equals" | "not_equals" | "greater_than" | "less_than" | "includes"
  value: string
}

export type ConditionNodeData = {
  branches?: {
    key: string
    logic: "AND" | "OR"
    rules: ConditionRule[]
  }[]
  fallbackBranchKey?: string
}

export type FlowTransitionTarget = {
  flowId: string
  entry?:
    | { type: "start" }
    | {
        type: "node"
        nodeId: string
      }
}

export type RedirectPayload = {
  target: FlowTransitionTarget
}

export type ActionNodeData = {
  actionType: "call_ai" | "show_result" | "redirect"
  payload?: Record<string, any> & {
    redirect?: RedirectPayload
  }
}

export type ResultNodeData = {
  title: string
  description: string
}

export type AlertNodeData = {
  text: string
  color?: "red" | "green"
}

export type FlowJumpNodeData = {
  target: FlowTransitionTarget
}

export type FlowNode =
  | { id: string; type: "question"; position: { x: number; y: number }; data: QuestionNodeData }
  | { id: string; type: "condition"; position: { x: number; y: number }; data: ConditionNodeData }
  | { id: string; type: "action"; position: { x: number; y: number }; data: ActionNodeData }
  | { id: string; type: "flow"; position: { x: number; y: number }; data: FlowJumpNodeData }
  | { id: string; type: "result"; position: { x: number; y: number }; data: ResultNodeData }
  | { id: string; type: "alert"; position: { x: number; y: number }; data: AlertNodeData }

export type FlowEdge = {
  id: string
  source: string
  target: string
  branchKey?: string
}

export type FlowDefinition = {
  nodes: FlowNode[]
  edges: FlowEdge[]
  version: number
  status: "draft" | "published"
  startNodeId: string
}

export type UserAnswers = Record<string, string | string[] | boolean | number | Record<string, number>>

export type FlowRunResultDTO = {
  resultId: string
  resolvedFlowId?: string
  nextNodeId?: string
  actionType?: string
  prompt?: string
  redirect?: RedirectPayload
  transition?: FlowTransitionTarget
  aiAnalysis?: any
  resultType?: "result" | "alert"
  resultColor?: "red" | "green"
  resultTitle?: string
  resultDescription?: string
}
