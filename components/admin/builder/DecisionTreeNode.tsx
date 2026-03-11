"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type DecisionTreeNodeData = {
  fieldKey: string
}

export function DecisionTreeNode({ data }: NodeProps<DecisionTreeNodeData>) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-xs font-semibold text-amber-700">
            DT
          </div>
          <div className="text-sm font-semibold leading-snug">Decision Tree</div>
        </div>

        <div className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">fan-out</div>
      </div>

      <div className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{data?.fieldKey || ""}</div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-amber-500" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-background !bg-amber-500" />
    </div>
  )
}
