export type AiMetadata = {
  tag: string
  weight: number
  includeInPrompt: boolean
}

export type QuestionNodeData = {
  label: string
  fieldKey: string
  inputType: "boolean" | "select" | "multi_select" | "text" | "number"
  options?: string[]
  aiMetadata?: AiMetadata
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

export type ActionNodeData = {
  actionType: "call_ai" | "show_result" | "redirect"
  payload?: Record<string, any>
}

export type ResultNodeData = {
  title: string
  description: string
}

export type AlertNodeData = {
  text: string
  color?: "red" | "green"
}

export type FlowNode =
  | { id: string; type: "question"; position: { x: number; y: number }; data: QuestionNodeData }
  | { id: string; type: "condition"; position: { x: number; y: number }; data: ConditionNodeData }
  | { id: string; type: "action"; position: { x: number; y: number }; data: ActionNodeData }
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

export type UserAnswers = Record<string, string | string[] | boolean | number>

export type FlowRunResultDTO = {
  resultId: string
  nextNodeId?: string
  actionType?: string
  prompt?: string
  aiAnalysis?: any
  resultType?: "result" | "alert"
  resultColor?: "red" | "green"
  resultTitle?: string
  resultDescription?: string
}
