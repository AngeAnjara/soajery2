"use client"

import { Handle, Position, type NodeProps } from "reactflow"

type QuestionGroupNodeData = {
  title?: string
  questions?: Array<{ label: string; fieldKey: string }>
}

export function QuestionGroupNode({ data }: NodeProps<QuestionGroupNodeData>) {
  const title = String((data as any)?.title || "Questions multiples")
  const count = Array.isArray((data as any)?.questions) ? (data as any).questions.length : 0

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-indigo-500" />
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-sm font-semibold leading-snug">{title}</div>
        <div className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{count} q</div>
      </div>
      <div className="text-xs text-muted-foreground">Node question multiple</div>
      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-indigo-500" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-background !bg-indigo-500" />
    </div>
  )
}
