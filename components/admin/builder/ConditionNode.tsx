"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type ConditionNodeData = {
  logic: "AND" | "OR"
  rules: { fieldKey: string; operator: string; value: string }[]
}

export function ConditionNode({ data }: NodeProps<ConditionNodeData>) {
  const rules = Array.isArray(data?.rules) ? data.rules : []

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-green-500" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-green-500/15 text-xs font-semibold text-green-600">
            C
          </div>
          <div className="text-sm font-semibold leading-snug">Condition</div>
        </div>

        <div className="flex items-center gap-2">
          <div className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{data?.logic || "AND"}</div>
        </div>
      </div>

      <div className="space-y-1 text-xs text-muted-foreground">
        {rules.length ? (
          rules.slice(0, 3).map((r, idx) => (
            <div key={idx} className="truncate">
              Si {r.fieldKey} {r.operator} {r.value}
            </div>
          ))
        ) : (
          <div className="opacity-70">Aucune règle</div>
        )}
        {rules.length > 3 ? <div className="text-[11px] opacity-70">+{rules.length - 3}…</div> : null}
      </div>

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-green-500" />

      <Handle
        id="true"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-green-500"
        style={{ top: "35%" }}
      />
      <Handle
        id="false"
        type="source"
        position={Position.Right}
        className="!h-3 !w-3 !border-2 !border-background !bg-red-500"
        style={{ top: "65%" }}
      />
    </div>
  )
}
