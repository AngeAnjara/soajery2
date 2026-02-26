"use client"

import * as React from "react"

type BuilderContextMenuProps = {
  x: number
  y: number
  type: "pane" | "node"
  nodeId?: string
  nodeKind?: "question" | "condition" | "action" | "result"
  onClose: () => void
  onAddQuestion: () => void
  onAddCondition: () => void
  onAddAction: () => void
  onAddResult: () => void
  onAddFlow: () => void
  onEdit: () => void
  onSetStart: () => void
  onDelete: () => void
}

export function BuilderContextMenu(props: BuilderContextMenuProps) {
  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={props.onClose} />
      <div
        className="absolute w-56 overflow-hidden rounded-md border bg-card text-sm shadow-lg"
        style={{ top: props.y, left: props.x }}
      >
        {props.type === "pane" ? (
          <div className="p-1">
            <button type="button" onClick={props.onAddQuestion} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Nouvelle question
            </button>
            <button type="button" onClick={props.onAddCondition} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Nouvelle condition
            </button>
            <button type="button" onClick={props.onAddAction} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Nouvelle action
            </button>
            <button type="button" onClick={props.onAddResult} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Nouveau résultat
            </button>
            <button type="button" onClick={props.onAddFlow} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Nouveau flow
            </button>
          </div>
        ) : (
          <div className="p-1">
            <button type="button" onClick={props.onSetStart} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Définir comme départ
            </button>
            <button type="button" onClick={props.onEdit} className="w-full rounded-sm px-3 py-2 text-left hover:bg-muted">
              Modifier
            </button>
            <button
              type="button"
              onClick={props.onDelete}
              className="w-full rounded-sm px-3 py-2 text-left text-destructive hover:bg-destructive/10"
            >
              Supprimer
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
