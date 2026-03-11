"use client"

import * as React from "react"
import { Handle, Position, type NodeProps } from "reactflow"

type QuestionNodeData = {
  label: string
  fieldKey: string
  inputType: "boolean" | "select" | "multi_select" | "text" | "number"
  options?: string[] | { id: string; label: string; maxCount?: number }[]
  aiMetadata?: {
    tag: string
    weight: number
    includeInPrompt: boolean
  }
}

export function QuestionNode({ data }: NodeProps<QuestionNodeData>) {
  const options = (Array.isArray(data?.options) ? data.options : [])
    .map((o: any) => (typeof o === "string" ? o : String(o?.label || o?.id || "").trim()))
    .filter((x: any) => typeof x === "string" && x.trim() !== "") as string[]
  const ai = data?.aiMetadata

  return (
    <div className="relative overflow-hidden rounded-xl border bg-card p-3 text-foreground shadow-sm">
      <div className="absolute left-0 top-0 h-full w-1 bg-blue-500" />

      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/15 text-xs font-semibold text-blue-600">
            Q
          </div>
          <div className="text-sm font-semibold leading-snug">{data?.label || "(Question)"}</div>
        </div>

        <div className="rounded-full border px-2 py-0.5 text-[11px] text-muted-foreground">{data?.inputType || ""}</div>
      </div>

      <div className="mb-2 flex flex-wrap items-center gap-2">
        <div className="rounded-full border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">{data?.fieldKey || ""}</div>
        {ai?.includeInPrompt ? (
          <div className="rounded-full border border-purple-500/40 bg-purple-500/10 px-2 py-0.5 text-[11px] font-medium text-purple-700">
            {ai?.tag || "AI"}
          </div>
        ) : null}
      </div>

      {options.length ? (
        <div className="space-y-1 text-xs text-muted-foreground">
          {options.slice(0, 4).map((opt, idx) => (
            <div key={idx} className="truncate">
              {opt}
            </div>
          ))}
          {options.length > 4 ? <div className="text-[11px] opacity-70">+{options.length - 4}…</div> : null}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground opacity-70">Aucune option</div>
      )}

      <Handle type="target" position={Position.Left} className="!h-3 !w-3 !border-2 !border-background !bg-blue-500" />
      <Handle type="source" position={Position.Right} className="!h-3 !w-3 !border-2 !border-background !bg-blue-500" />
    </div>
  )
}
