"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type AlertNodeData = {
  text: string
}

export function AlertNode({ data }: NodeProps<AlertNodeData>) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-red-600" />

      <div className="mb-1 flex items-center gap-2">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-red-600/15 text-xs font-semibold text-red-700">!</div>
        <div className="text-sm font-semibold leading-snug text-red-700">Avertissement</div>
      </div>

      <div className="text-xs text-red-600 line-clamp-4 whitespace-pre-wrap">{data?.text || "(Message)"}</div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-red-600" />
    </div>
  )
}
