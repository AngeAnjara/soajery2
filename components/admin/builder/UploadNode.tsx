"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type UploadNodeData = {
  label: string
  fieldKey: string
  accept?: string
  maxSizeMb?: number
}

export function UploadNode({ data }: NodeProps<UploadNodeData>) {
  const label = String(data?.label || "") || "(Upload)"
  const fieldKey = String(data?.fieldKey || "")
  const accept = typeof data?.accept === "string" ? data.accept : ""
  const maxSizeMb = typeof data?.maxSizeMb === "number" && Number.isFinite(data.maxSizeMb) ? data.maxSizeMb : undefined

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-amber-500" />

      <Handle type="target" position={Position.Left} style={{ background: "#f59e0b" }} />
      <Handle type="source" position={Position.Right} style={{ background: "#f59e0b" }} />

      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15 text-xs font-semibold text-amber-600">
            U
          </div>
          <div className="truncate text-sm font-semibold">{label}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{fieldKey || "fieldKey"}</div>
          {accept ? <div className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">{accept}</div> : null}
        </div>

        <div className="text-xs text-muted-foreground">{typeof maxSizeMb === "number" ? `Max: ${maxSizeMb} Mo` : "Aucune limite"}</div>
      </div>
    </div>
  )
}
