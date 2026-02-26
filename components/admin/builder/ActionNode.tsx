"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ActionNodeData = {
  actionType: "call_ai" | "show_result" | "redirect"
  payload?: Record<string, any>
}

export function ActionNode({ data }: NodeProps<ActionNodeData>) {
  const actionType = data?.actionType || "call_ai"

  const styles =
    actionType === "call_ai"
      ? {
          stripe: "bg-purple-500",
          badge: "bg-purple-500/15 text-purple-600",
        }
      : actionType === "show_result"
        ? {
            stripe: "bg-blue-500",
            badge: "bg-blue-500/15 text-blue-600",
          }
        : {
            stripe: "bg-orange-500",
            badge: "bg-orange-500/15 text-orange-600",
          }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.stripe}`} />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${styles.badge}`}>A</div>
          <div className="text-sm font-semibold leading-snug">Action</div>
        </div>

        <div className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{actionType}</div>
      </div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-background !bg-muted-foreground" />
    </div>
  )
}
