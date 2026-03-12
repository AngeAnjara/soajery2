"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type OpenAIVisionNodeData = {
  model: "gpt-4o" | "gpt-4-turbo" | "gpt-4-vision-preview"
  prompt: string
  outputFieldKey: string
}

export function OpenAIVisionNode({ data }: NodeProps<OpenAIVisionNodeData>) {
  const model = String(data?.model || "gpt-4o")
  const outputFieldKey = String(data?.outputFieldKey || "")
  const prompt = String(data?.prompt || "")

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-violet-500" />

      <Handle type="target" position={Position.Left} style={{ background: "#7c3aed" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#7c3aed" }} />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/15 text-xs font-semibold text-violet-600">
            V
          </div>
          <div className="truncate text-sm font-semibold">Vision AI</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-md bg-violet-500/15 px-2 py-1 text-xs font-medium text-violet-600">{model}</div>
          <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{outputFieldKey || "outputFieldKey"}</div>
        </div>

        <div className="truncate text-xs text-muted-foreground">{prompt || ""}</div>
      </div>
    </div>
  )
}
