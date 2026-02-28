"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type AlertNodeData = {
  text: string
  color?: "red" | "green"
}

export function AlertNode({ data }: NodeProps<AlertNodeData>) {
  const color = data?.color === "green" ? "green" : "red"

  const styles =
    color === "green"
      ? { stripe: "bg-green-600", badge: "bg-green-600/15 text-green-700", text: "text-green-600", title: "text-green-700" }
      : { stripe: "bg-red-600", badge: "bg-red-600/15 text-red-700", text: "text-red-600", title: "text-red-700" }

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className={`absolute left-0 top-0 h-full w-1 ${styles.stripe}`} />

      <div className="mb-1 flex items-center gap-2">
        <div className={`inline-flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold ${styles.badge}`}>!</div>
        <div className={`text-sm font-semibold leading-snug ${styles.title}`}>Avertissement</div>
      </div>

      <div className={`text-xs line-clamp-4 whitespace-pre-wrap ${styles.text}`}>{data?.text || "(Message)"}</div>

      <Handle type="target" position={Position.Left} className={`!h-3 !w-3 !border-2 !border-background ${styles.stripe}`} />
    </div>
  )
}
