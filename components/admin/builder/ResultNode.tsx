"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ResultNodeData = {
  title: string
  description: string
}

export function ResultNode({ data }: NodeProps<ResultNodeData>) {
  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-slate-500" />

      <div className="mb-1 flex items-center gap-2">
        <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-slate-500/15 text-xs font-semibold text-slate-700">R</div>
        <div className="text-sm font-semibold leading-snug">{data?.title || "(Résultat)"}</div>
      </div>

      <div className="text-xs text-muted-foreground line-clamp-3">{data?.description || ""}</div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-slate-500" />
    </div>
  )
}
