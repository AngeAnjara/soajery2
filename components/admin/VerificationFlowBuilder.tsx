"use client"

import * as React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { toast } from "sonner"
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  MarkerType,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type OnConnect,
} from "reactflow"
import "reactflow/dist/style.css"

import { CrudModal } from "@/components/admin/CrudModal"
import { BuilderContextMenu } from "@/components/admin/builder/BuilderContextMenu"
import { ConditionNode } from "@/components/admin/builder/ConditionNode"
import { ActionNode } from "@/components/admin/builder/ActionNode"
import { QuestionNode } from "@/components/admin/builder/QuestionNode"
import { ResultNode } from "@/components/admin/builder/ResultNode"
import { AlertNode } from "@/components/admin/builder/AlertNode"
import { FlowNode } from "@/components/admin/builder/FlowNode"
import { Button } from "@/components/ui/button"

const nodeTypes = {
  questionNode: QuestionNode,
  conditionNode: ConditionNode,
  actionNode: ActionNode,
  resultNode: ResultNode,
  alertNode: AlertNode,
  flowNode: FlowNode,
}

export function VerificationFlowBuilder() {
  const [tab, setTab] = React.useState("flows")

  const [flows, setFlows] = React.useState<any[]>([])
  const [flowId, setFlowId] = React.useState<string>("")

  const loadedRef = React.useRef(false)

  const [open, setOpen] = React.useState(false)
  const [mode, setMode] = React.useState<"create" | "edit">("create")
  const [entity, setEntity] = React.useState<"flow" | "node">("flow")
  const [editing, setEditing] = React.useState<any>(null)

  const [isDirty, setIsDirty] = React.useState(false)
  const [startNodeId, setStartNodeId] = React.useState<string>("")

  const [flowForm, setFlowForm] = React.useState({ title: "", description: "", priceForDetailedReport: 0, status: "draft" as "draft" | "published" })
  const [nodeForm, setNodeForm] = React.useState<any>({})
  const [nodeOptionsText, setNodeOptionsText] = React.useState<string>("")

  const [rfNodes, setRfNodes, onNodesChange] = useNodesState<Node>([])
  const [rfEdges, setRfEdges, onEdgesChange] = useEdgesState<Edge>([])

  const rfNodePositionsRef = React.useRef<Map<string, { x: number; y: number }>>(new Map())

  const [nodesDraggable, setNodesDraggable] = React.useState(true)
  const [contextMenu, setContextMenu] = React.useState<
    | {
        x: number
        y: number
        type: "pane" | "node"
        nodeId?: string
        nodeKind?: "question" | "condition" | "action" | "result"
      }
    | null
  >(null)

  const loadFlows = async () => {
    const res = await fetch("/api/admin/verification/flows")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setFlows(data.flows || [])
    if (!flowId && data.flows?.[0]?._id) {
      setFlowId(String(data.flows[0]._id))
    }
  }

  const loadFlow = React.useCallback(
    async (fid: string) => {
      const res = await fetch("/api/admin/verification/flows")
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur")

      const list = data.flows || []
      setFlows(list)

      const flow = list.find((f: any) => String(f._id) === String(fid))
      if (!flow) return

      setFlowForm({
        title: flow.title || "",
        description: flow.description || "",
        priceForDetailedReport: Number(flow.priceForDetailedReport || 0),
        status: (flow.status || "draft") as any,
      })

      setStartNodeId(String(flow.startNodeId || ""))
      setIsDirty(false)

      const nodes = Array.isArray(flow.nodes) ? flow.nodes : []
      const edges = Array.isArray(flow.edges) ? flow.edges : []

      setRfNodes(
        nodes.map((n: any) => ({
          id: String(n.id),
          type:
            n.type === "question"
              ? "questionNode"
              : n.type === "condition"
                ? "conditionNode"
                : n.type === "action"
                  ? "actionNode"
                  : n.type === "flow"
                    ? "flowNode"
                    : n.type === "alert"
                      ? "alertNode"
                      : "resultNode",
          data:
            n.type === "condition"
              ? (() => {
                  const d = n.data || {}
                  if (Array.isArray(d.branches)) return d
                  if (Array.isArray(d.rules)) {
                    return {
                      branches: [
                        { key: "true", logic: String(d.logic || "AND"), rules: d.rules },
                        { key: "false", logic: "AND", rules: [] },
                      ],
                      fallbackBranchKey: "false",
                    }
                  }
                  return {
                    branches: [
                      { key: "branch_1", logic: "AND", rules: [] },
                      { key: "branch_2", logic: "AND", rules: [] },
                      { key: "branch_3", logic: "AND", rules: [] },
                      { key: "branch_4", logic: "AND", rules: [] },
                    ],
                    fallbackBranchKey: "default",
                  }
                })()
              : n.data || {},
          position: n.position || { x: 0, y: 0 },
          style: String(n.id) === String(flow.startNodeId) ? { borderColor: "hsl(var(--primary))", borderWidth: 2 } : undefined,
        })),
      )

      setRfEdges(
        edges.map((e: any) => ({
          ...(e || {}),
          id: String(e.id),
          source: String(e.source),
          target: String(e.target),
          sourceHandle: String((e?.branchKey ?? e?.sourceHandle ?? "") || "") || undefined,
          branchKey: String((e?.branchKey ?? e?.sourceHandle ?? "") || "") || undefined,
          type: "smoothstep",
          markerEnd: { type: MarkerType.ArrowClosed },
          style: { stroke: "hsl(var(--primary))" },
        })),
      )

      loadedRef.current = true
    },
    [setRfNodes, setRfEdges],
  )

  React.useEffect(() => {
    loadFlows().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  React.useEffect(() => {
    if (!flowId) return
    loadFlow(flowId).catch((e) => toast.error(e?.message || "Erreur"))
  }, [flowId])

  React.useEffect(() => {
    const next = new Map<string, { x: number; y: number }>()
    rfNodes.forEach((n) => {
      if (!n?.id || !n?.position) return
      next.set(String(n.id), { x: n.position.x, y: n.position.y })
    })
    rfNodePositionsRef.current = next
  }, [rfNodes])

  React.useEffect(() => {
    if (!loadedRef.current) return
    setIsDirty(true)
  }, [rfNodes, rfEdges])

  const openCreate = (e: typeof entity, kind?: any) => {
    setEntity(e)
    setMode("create")
    setEditing(null)

    if (e === "flow") {
      setFlowForm({ title: "", description: "", priceForDetailedReport: 0, status: "draft" })
    }

    if (e === "node") {
      setNodeForm(kind || {})
      const opts = Array.isArray(kind?.data?.options) ? kind.data.options : []
      setNodeOptionsText(opts.join("\n"))
    }

    setOpen(true)
  }

  const setStart = React.useCallback(
    (nodeId: string) => {
      setStartNodeId(nodeId)
      setRfNodes((prev) =>
        prev.map((n) => {
          const isStart = String(n.id) === String(nodeId)
          return {
            ...n,
            style: isStart ? { ...(n.style || {}), borderColor: "hsl(var(--primary))", borderWidth: 2 } : undefined,
          }
        }),
      )
      setIsDirty(true)
    },
    [setRfNodes],
  )

  const removeNode = React.useCallback(
    (nodeId: string) => {
      setRfNodes((prev) => prev.filter((n) => String(n.id) !== String(nodeId)))
      setRfEdges((prev) => prev.filter((e) => String(e.source) !== String(nodeId) && String(e.target) !== String(nodeId)))
      if (String(startNodeId) === String(nodeId)) {
        setStartNodeId("")
      }
      setIsDirty(true)
    },
    [setRfNodes, setRfEdges, startNodeId],
  )

  const createNodeId = (prefix: string) => {
    return `${prefix}:${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`
  }

  const openEdit = (e: typeof entity, row: any) => {
    setEntity(e)
    setMode("edit")
    setEditing(row)

    if (e === "flow") {
      setFlowForm({
        title: row.title || "",
        description: row.description || "",
        priceForDetailedReport: row.priceForDetailedReport || 0,
        status: (row.status || "draft") as any,
      })
    }

    if (e === "node") {
      setNodeForm(row)
      const opts = Array.isArray(row?.data?.options) ? row.data.options : []
      setNodeOptionsText(opts.join("\n"))
    }

    setOpen(true)
  }

  const onConnect: OnConnect = React.useCallback(
    (connection) => {
      const source = String(connection.source || "")
      const target = String(connection.target || "")

      if (!source || !target) return

      const sourceNode = rfNodes.find((n) => String(n.id) === source)
      const targetNode = rfNodes.find((n) => String(n.id) === target)
      if (!sourceNode || !targetNode) return

      const sourceKind = String(sourceNode.type || "")
      const targetKind = String(targetNode.type || "")

      const allowed =
        (sourceKind === "questionNode" && (targetKind === "conditionNode" || targetKind === "questionNode")) ||
        (sourceKind === "conditionNode" &&
          (targetKind === "questionNode" || targetKind === "actionNode" || targetKind === "resultNode" || targetKind === "alertNode" || targetKind === "flowNode")) ||
        (sourceKind === "actionNode" && (targetKind === "resultNode" || targetKind === "alertNode" || targetKind === "flowNode"))

      if (!allowed) {
        toast.error("Connexion non autorisée")
        return
      }

      if (sourceKind === "questionNode" && targetKind === "conditionNode") {
        const questionFieldKey = String((sourceNode as any)?.data?.fieldKey || "")
        const questionInputType = String((sourceNode as any)?.data?.inputType || "")
        const questionOptions = Array.isArray((sourceNode as any)?.data?.options) ? (sourceNode as any).data.options : []

        let defaultValue = ""
        if (questionInputType === "boolean") {
          defaultValue = "true"
        } else if (questionInputType === "select") {
          defaultValue = String(questionOptions[0] ?? "")
        }

        if (!defaultValue) {
          const v = window.prompt("Valeur attendue pour la condition", "")
          if (!v || !v.trim()) {
            toast.error("Valeur requise")
            return
          }
          defaultValue = v.trim()
        }

        setRfNodes((prev) => {
          return prev.map((n) => {
            if (String(n.id) !== target) return n
            const branches = Array.isArray((n as any)?.data?.branches) ? (n as any).data.branches : []
            const nextBranches = branches.length
              ? [...branches]
              : [
                  { key: "branch_1", logic: "AND", rules: [] },
                  { key: "branch_2", logic: "AND", rules: [] },
                  { key: "branch_3", logic: "AND", rules: [] },
                  { key: "branch_4", logic: "AND", rules: [] },
                ]

            const firstRules = Array.isArray(nextBranches?.[0]?.rules) ? nextBranches[0].rules : []
            if (firstRules.some((r: any) => String(r?.fieldKey || "") === questionFieldKey)) return n

            nextBranches[0] = {
              ...(nextBranches[0] || { key: "branch_1", logic: "AND", rules: [] }),
              rules: [
                ...firstRules,
                {
                  fieldKey: questionFieldKey,
                  operator: "equals",
                  value: defaultValue,
                },
              ],
            }
            return {
              ...n,
              data: {
                ...(n as any).data,
                branches: nextBranches,
                fallbackBranchKey: (n as any).data?.fallbackBranchKey || "default",
              },
            }
          })
        })

        setTimeout(() => {
          const row = resolveNodeRow(target)
          if (row) {
            openEdit("node", { id: row.id, type: row.type, data: row.data, position: row.position })
          }
        }, 0)
      }

      let branchKey: string | undefined = undefined
      const edgeBranchKey = (e: any) => String(e?.branchKey ?? e?.sourceHandle ?? "").trim()

      if (sourceKind === "conditionNode") {
        const fromHandle = String(connection.sourceHandle || "").trim()
        if (fromHandle) {
          branchKey = fromHandle
        }
        const branchKeys = Array.isArray((sourceNode as any)?.data?.branches)
          ? (sourceNode as any).data.branches.map((b: any) => String(b?.key || "").trim()).filter(Boolean)
          : []
        const hint = branchKeys.length ? `Ex: ${branchKeys.slice(0, 4).join(", ")}` : "Ex: branch_1"
        if (!branchKey) {
          const choice = window.prompt(`Branch key (${hint})`, branchKeys[0] || "branch_1")
          const key = String(choice || "").trim()
          if (!key) {
            toast.error("Branch key requis")
            return
          }
          branchKey = key
        }
      }

      if (sourceKind === "questionNode" || sourceKind === "actionNode") {
        const existing = rfEdges.filter((e) => String(e.source) === source)
        if (existing.length >= 1) {
          toast.error("Ce node doit avoir une seule sortie")
          return
        }
      }

      if (sourceKind === "conditionNode") {
        const key = branchKey || "__default__"
        const exists = rfEdges.some((e) => String(e.source) === source && edgeBranchKey(e) === (key === "__default__" ? "" : key))
        if (exists) {
          toast.error("Connexion déjà utilisée pour ce branch")
          return
        }
      }

      setRfEdges((prev) => {
        const id = `e:${source}->${target}:${branchKey || "_"}`
        if (prev.some((e) => String(e.id) === id)) return prev
        return [
          ...prev,
          {
            id,
            source,
            target,
            sourceHandle: branchKey,
            branchKey,
            type: "smoothstep",
            markerEnd: { type: MarkerType.ArrowClosed },
            style: { stroke: "hsl(var(--primary))" },
          },
        ]
      })
    },
    [rfNodes, setRfEdges, setRfNodes, resolveNodeRow],
  )

  const onPaneContextMenu = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault()
    setContextMenu({ type: "pane", x: event.clientX, y: event.clientY })
  }, [])

  const onNodeContextMenu = React.useCallback((event: React.MouseEvent, node: Node) => {
    event.preventDefault()
    const id = String(node.id || "")
    const nodeKind = node.type === "questionNode" ? "question" : node.type === "conditionNode" ? "condition" : node.type === "actionNode" ? "action" : node.type === "resultNode" ? "result" : undefined
    setContextMenu({ type: "node", x: event.clientX, y: event.clientY, nodeId: id, nodeKind })
  }, [])

  function resolveNodeRow(nodeId?: string) {
    if (!nodeId) return null
    return rfNodes.find((n) => String(n.id) === String(nodeId)) || null
  }

  const onNodesDelete = React.useCallback(
    (deleted: Node[]) => {
      deleted.forEach((n) => {
        const id = String(n.id || "")
        removeNode(id)
      })
    },
    [removeNode],
  )

  const onEdgesDelete = React.useCallback(
    (deleted: Edge[]) => {
      const ids = new Set(deleted.map((e) => String(e.id)))
      setRfEdges((prev) => prev.filter((e) => !ids.has(String(e.id))))
      setIsDirty(true)
    },
    [setRfEdges],
  )

  function FlowToolbar() {
    const rf = useReactFlow()

    return (
      <Panel position="top-left" className="rounded-md border bg-card p-2 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "questionNode",
                data: { label: "Question", fieldKey: `field_${rfNodes.length + 1}`, inputType: "select", options: ["Option 1", "Option 2"], aiMetadata: { tag: "", weight: 1, includeInPrompt: false } },
                position: { x: 40, y: 40 },
              }
              setRfNodes((prev) => [...prev, node])
              if (!startNodeId) setStart(id)
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Question
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "conditionNode",
                data: {
                  branches: [
                    { key: "branch_1", logic: "AND", rules: [] },
                    { key: "branch_2", logic: "AND", rules: [] },
                    { key: "branch_3", logic: "AND", rules: [] },
                    { key: "branch_4", logic: "AND", rules: [] },
                  ],
                  fallbackBranchKey: "default",
                },
                position: { x: 380, y: 40 },
              }
              setRfNodes((prev) => [...prev, node])
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Condition
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "actionNode",
                data: { actionType: "call_ai" },
                position: { x: 720, y: 40 },
              }
              setRfNodes((prev) => [...prev, node])
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Action
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "resultNode",
                data: { title: "Résultat", description: "" },
                position: { x: 980, y: 40 },
              }
              setRfNodes((prev) => [...prev, node])
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Result
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "alertNode",
                data: { text: "", color: "red" },
                position: { x: 980, y: 140 },
              }
              setRfNodes((prev) => [...prev, node])
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Alert
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              if (!flowId) return
              const id = createNodeId("n")
              const node: Node = {
                id,
                type: "flowNode",
                data: { target: { flowId: "", entry: { type: "start" } } },
                position: { x: 980, y: 240 },
              }
              setRfNodes((prev) => [...prev, node])
              setIsDirty(true)
            }}
            disabled={!flowId}
          >
            + Jump
          </Button>
          <Button type="button" size="sm" onClick={() => openCreate("flow")}>
            + Flow
          </Button>

          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={async () => {
              try {
                if (!flowId) return
                if (!startNodeId) throw new Error("Définissez un start node")

                const nodeIds = new Set(rfNodes.map((n) => String(n.id)))
                if (!nodeIds.has(String(startNodeId))) {
                  throw new Error("Start node invalide (supprimé). Définissez un start node")
                }

                const inferConditionFieldKey = (conditionId: string) => {
                  const incoming = rfEdges.find((e) => String(e.target) === String(conditionId))
                  if (!incoming) return ""
                  const sourceNode = rfNodes.find((n) => String(n.id) === String(incoming.source))
                  if (!sourceNode || sourceNode.type !== "questionNode") return ""
                  return String((sourceNode as any)?.data?.fieldKey || "")
                }

                const questionFieldKeys = new Set(
                  rfNodes
                    .filter((n) => n.type === "questionNode")
                    .map((n) => String((n as any)?.data?.fieldKey || ""))
                    .filter(Boolean),
                )

                const normalizeBooleanRuleValue = (v: any) => {
                  const s = String(v ?? "").trim().toLowerCase()
                  if (s === "oui" || s === "true") return "true"
                  if (s === "non" || s === "false") return "false"
                  return String(v ?? "")
                }

                const payload = {
                  title: flowForm.title,
                  description: flowForm.description || undefined,
                  priceForDetailedReport: Number(flowForm.priceForDetailedReport),
                  status: flowForm.status,
                  startNodeId,
                  version: 1,
                  nodes: rfNodes.map((n) => {
                    if (n.type === "flowNode") {
                      const fid = String((n as any)?.data?.target?.flowId || "").trim()
                      if (!fid) {
                        throw new Error("Flow jump invalide: choisissez un flow cible")
                      }
                      return {
                        id: String(n.id),
                        type: "flow",
                        position: n.position,
                        data: n.data,
                      }
                    }
                    if (n.type === "conditionNode") {
                      const inferred = inferConditionFieldKey(String(n.id))
                      const branches = Array.isArray((n as any)?.data?.branches) ? (n as any).data.branches : []

                      if (!branches.length) {
                        throw new Error("Définissez au moins une branche pour la condition")
                      }

                      const seenKeys = new Set<string>()

                      const normalizedBranches = branches
                        .map((b: any) => {
                          const key = String(b?.key || "").trim()
                          if (!key) {
                            throw new Error(`Branche invalide: key vide dans la condition '${String(n.id)}'`)
                          }
                          if (seenKeys.has(key)) {
                            throw new Error(`Branche invalide: key dupliquée '${key}' dans la condition '${String(n.id)}'`)
                          }
                          seenKeys.add(key)

                          const logic = String(b?.logic || "AND") as any
                          const rules = Array.isArray(b?.rules) ? b.rules : []

                          const transition = b?.transition && typeof b.transition === "object" ? b.transition : undefined
                          const normalizedTransition =
                            transition && String((transition as any)?.flowId || "").trim()
                              ? {
                                  flowId: String((transition as any).flowId),
                                  entry:
                                    transition?.entry && typeof transition.entry === "object"
                                      ? (transition.entry as any)
                                      : undefined,
                                }
                              : undefined

                          const normalizedRules = rules
                            .map((r: any) => {
                              let fieldKey = String(r?.fieldKey || "")
                              if (!fieldKey) fieldKey = String(inferred || "")
                              if (fieldKey && !questionFieldKeys.has(fieldKey) && inferred) fieldKey = String(inferred)

                              const operator = String(r?.operator || "equals")
                              const q = rfNodes.find((qn) => qn.type === "questionNode" && String((qn as any)?.data?.fieldKey || "") === fieldKey)
                              const isBool = String((q as any)?.data?.inputType || "") === "boolean"
                              const value = isBool ? normalizeBooleanRuleValue(r?.value) : String(r?.value ?? "")

                              return { fieldKey, operator, value }
                            })
                            .filter((r: any) => r.fieldKey && String(r.value ?? "").trim() !== "")

                          return { key, logic, rules: normalizedRules, ...(normalizedTransition ? { transition: normalizedTransition } : {}) }
                        })


                      return {
                        id: String(n.id),
                        type: "condition",
                        position: rfNodePositionsRef.current.get(String(n.id)) || (n.position as any),
                        data: {
                          ...(n as any).data,
                          branches: normalizedBranches,
                        },
                      }
                    }

                    return {
                      id: String(n.id),
                      type:
                        n.type === "questionNode"
                          ? "question"
                          : n.type === "actionNode"
                            ? "action"
                            : n.type === "alertNode"
                              ? "alert"
                              : "result",
                      position: n.position,
                      data: n.data,
                    }
                  }),
                  edges: rfEdges
                    .filter((e) => nodeIds.has(String(e.source)) && nodeIds.has(String(e.target)))
                    .map((e) => ({
                      id: String(e.id),
                      source: String(e.source),
                      target: String(e.target),
                      branchKey: String((e as any).branchKey ?? (e as any).sourceHandle ?? "").trim() || undefined,
                    })),
                }

                const outgoingCounts = new Map<string, number>()
                const branchPairs = new Set<string>()

                rfEdges.forEach((e) => {
                  const src = String(e.source)
                  outgoingCounts.set(src, (outgoingCounts.get(src) || 0) + 1)
                  const key = String((e as any).branchKey || "").trim() || "__default__"
                  const pair = `${src}::${key}`
                  if (branchPairs.has(pair)) {
                    throw new Error("Ambiguous routing: duplicate branch key for a node")
                  }
                  branchPairs.add(pair)
                })

                rfNodes.forEach((n) => {
                  if (n.type !== "questionNode" && n.type !== "actionNode") return
                  const count = outgoingCounts.get(String(n.id)) || 0
                  if (count > 1) {
                    throw new Error("Invalid graph: question/action must have only 1 outgoing edge")
                  }
                })

                const res = await fetch(`/api/admin/verification/flows/${flowId}`, {
                  method: "PATCH",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify(payload),
                })
                const data = await res.json()
                if (!res.ok) throw new Error(data?.error || "Erreur")
                toast.success("Flow enregistré")
                setIsDirty(false)
                await loadFlows()
              } catch (e: any) {
                toast.error(e?.message || "Erreur")
              }
            }}
            disabled={!flowId || !isDirty}
          >
            Save
          </Button>

          <div className="mx-1 h-5 w-px bg-border" />

          <Button type="button" size="sm" variant="outline" onClick={() => rf.fitView()}>
            Fit View
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => setNodesDraggable((v) => !v)}
            disabled={!flowId}
          >
            {nodesDraggable ? "Lock" : "Unlock"}
          </Button>
        </div>
      </Panel>
    )
  }

  const submit = async () => {
    try {
      if (entity === "flow") {
        const basePayload = {
          title: flowForm.title,
          description: flowForm.description || undefined,
          priceForDetailedReport: Number(flowForm.priceForDetailedReport),
          status: flowForm.status,
        }

        const payload =
          mode === "create"
            ? {
                ...basePayload,
                version: 1,
                startNodeId: "start",
                nodes: [
                  {
                    id: "start",
                    type: "question",
                    position: { x: 40, y: 40 },
                    data: { label: "Question", fieldKey: "field_1", inputType: "select", options: ["Oui", "Non"], aiMetadata: { tag: "", weight: 1, includeInPrompt: false } },
                  },
                ],
                edges: [],
              }
            : basePayload

        const res = await fetch(
          mode === "create" ? "/api/admin/verification/flows" : `/api/admin/verification/flows/${editing._id}`,
          {
            method: mode === "create" ? "POST" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        )
        const data = await res.json()
        if (!res.ok) throw new Error(data?.error || "Erreur")
        toast.success(mode === "create" ? "Flow créé" : "Flow mis à jour")
        setOpen(false)
        await loadFlows()
        return
      }

      if (entity === "node") {
        const normalizedOptions = nodeOptionsText
          .split("\n")
          .map((x) => x.trim())
          .filter(Boolean)

        const shouldApplyOptions = ["select", "multi_select"].includes(String(nodeForm?.data?.inputType || ""))

        const nodeId = mode === "edit" ? String(editing?.id) : createNodeId("n")
        const nodeType = String(nodeForm?.type || "questionNode")

        const oldQuestionFieldKey =
          mode === "edit" && nodeType === "questionNode" ? String((editing as any)?.data?.fieldKey || "") : ""
        const nextQuestionFieldKey = nodeType === "questionNode" ? String((nodeForm as any)?.data?.fieldKey || "") : ""

        const next: Node = {
          id: nodeId,
          type: nodeType,
          data: {
            ...(nodeForm.data || {}),
            ...(shouldApplyOptions ? { options: normalizedOptions } : {}),
          },
          position: mode === "edit" ? editing.position : { x: 80, y: 80 },
        }

        setRfNodes((prev) => {
          let base = prev
          if (oldQuestionFieldKey && nextQuestionFieldKey && oldQuestionFieldKey !== nextQuestionFieldKey) {
            base = base.map((n) => {
              if (n.type !== "conditionNode") return n
              const d: any = (n as any).data || {}

              const legacyRules = Array.isArray(d?.rules) ? d.rules : []
              const nextLegacyRules = legacyRules.map((r: any) =>
                String(r?.fieldKey || "") === oldQuestionFieldKey ? { ...r, fieldKey: nextQuestionFieldKey } : r,
              )

              const branches = Array.isArray(d?.branches) ? d.branches : []
              const nextBranches = branches.map((b: any) => {
                const rules = Array.isArray(b?.rules) ? b.rules : []
                const nextRules = rules.map((r: any) =>
                  String(r?.fieldKey || "") === oldQuestionFieldKey ? { ...r, fieldKey: nextQuestionFieldKey } : r,
                )
                return { ...(b || {}), rules: nextRules }
              })

              return { ...n, data: { ...d, rules: nextLegacyRules, branches: nextBranches } }
            })
          }
          if (mode === "edit") {
            return base.map((n) => (String(n.id) === nodeId ? { ...n, ...next } : n))
          }
          return [...base, next]
        })

        if (!startNodeId) setStart(nodeId)

        setOpen(false)
        setIsDirty(true)
        return
      }
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    }
  }

  async function removeFlow(row: any) {
    try {
      const res = await fetch(`/api/admin/verification/flows/${row._id}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur")
      toast.success("Supprimé")
      await loadFlows()
    } catch (err: any) {
      toast.error(err?.message || "Erreur")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">Vérification</div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <select
            value={flowId}
            onChange={(e) => setFlowId(e.target.value)}
            className="h-10 rounded-md border bg-background px-3 text-sm"
          >
            <option value="">Choisir un flow</option>
            {flows.map((f) => (
              <option key={f._id} value={String(f._id)}>
                {f.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Tabs.Root value={tab} onValueChange={setTab}>
        <Tabs.List className="flex flex-wrap gap-2">
          <Tabs.Trigger className="rounded-md border px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" value="builder">
            Builder
          </Tabs.Trigger>
          <Tabs.Trigger className="rounded-md border px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground" value="flows">
            Flows
          </Tabs.Trigger>
        </Tabs.List>

        <Tabs.Content value="builder" className="mt-4 space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-sm text-muted-foreground">
              Connectez une question à une condition. Après connexion, la condition s’ouvre pour renseigner la valeur attendue.
            </div>
            <div />
          </div>

          <div className="h-[70vh] w-full overflow-hidden rounded-md border bg-background">
            <ReactFlow
              nodes={rfNodes}
              edges={rfEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodesDelete={onNodesDelete}
              onEdgesDelete={onEdgesDelete}
              onConnect={onConnect}
              onPaneContextMenu={onPaneContextMenu}
              onNodeContextMenu={onNodeContextMenu}
              onNodeDoubleClick={(event, node) => {
                event.preventDefault()
                openEdit("node", {
                  id: String(node.id),
                  type: node.type,
                  data: node.data,
                  position: node.position,
                })
              }}
              nodesDraggable={nodesDraggable}
              nodeTypes={nodeTypes}
              fitView
            >
              <Background />
              <MiniMap pannable zoomable />
              <Controls />
              <FlowToolbar />
            </ReactFlow>
          </div>

          {contextMenu ? (
            <BuilderContextMenu
              x={contextMenu.x}
              y={contextMenu.y}
              type={contextMenu.type}
              nodeId={contextMenu.nodeId}
              nodeKind={contextMenu.nodeKind}
              onClose={() => setContextMenu(null)}
              onAddQuestion={() => {
                if (!flowId) {
                  setContextMenu(null)
                  return
                }
                const id = createNodeId("n")
                const node: Node = {
                  id,
                  type: "questionNode",
                  data: {
                    label: "Question",
                    fieldKey: `field_${rfNodes.length + 1}`,
                    inputType: "select",
                    options: ["Oui", "Non"],
                    aiMetadata: { tag: "", weight: 1, includeInPrompt: false },
                  },
                  position: { x: 40, y: 40 },
                }
                setRfNodes((prev) => [...prev, node])
                if (!startNodeId) setStart(id)
                setIsDirty(true)
                setContextMenu(null)
              }}
              onAddCondition={() => {
                if (!flowId) {
                  setContextMenu(null)
                  return
                }
                const id = createNodeId("n")
                const node: Node = {
                  id,
                  type: "conditionNode",
                  data: {
                    branches: [
                      { key: "branch_1", logic: "AND", rules: [] },
                      { key: "branch_2", logic: "AND", rules: [] },
                      { key: "branch_3", logic: "AND", rules: [] },
                      { key: "branch_4", logic: "AND", rules: [] },
                    ],
                    fallbackBranchKey: "default",
                  },
                  position: { x: 380, y: 40 },
                }
                setRfNodes((prev) => [...prev, node])
                setIsDirty(true)
                setContextMenu(null)
              }}
              onAddAction={() => {
                if (!flowId) {
                  setContextMenu(null)
                  return
                }
                const id = createNodeId("n")
                const node: Node = {
                  id,
                  type: "actionNode",
                  data: { actionType: "call_ai" },
                  position: { x: 720, y: 40 },
                }
                setRfNodes((prev) => [...prev, node])
                setIsDirty(true)
                setContextMenu(null)
              }}
              onAddResult={() => {
                if (!flowId) {
                  setContextMenu(null)
                  return
                }
                const id = createNodeId("n")
                const node: Node = {
                  id,
                  type: "resultNode",
                  data: { title: "Résultat", description: "" },
                  position: { x: 980, y: 40 },
                }
                setRfNodes((prev) => [...prev, node])
                setIsDirty(true)
                setContextMenu(null)
              }}
              onAddFlowNode={() => {
                if (!flowId) {
                  setContextMenu(null)
                  return
                }
                const id = createNodeId("n")
                const node: Node = {
                  id,
                  type: "flowNode",
                  data: { target: { flowId: "", entry: { type: "start" } } },
                  position: { x: 980, y: 240 },
                }
                setRfNodes((prev) => [...prev, node])
                setIsDirty(true)
                setContextMenu(null)
              }}
              onAddFlow={() => {
                openCreate("flow")
                setContextMenu(null)
              }}
              onSetStart={() => {
                if (contextMenu.nodeId) {
                  setStart(contextMenu.nodeId)
                }
                setContextMenu(null)
              }}
              onEdit={() => {
                const row = resolveNodeRow(contextMenu.nodeId)
                if (row) {
                  openEdit("node", { id: row.id, type: row.type, data: row.data, position: row.position })
                }
                setContextMenu(null)
              }}
              onDelete={() => {
                if (contextMenu.nodeId) {
                  removeNode(contextMenu.nodeId)
                }
                setContextMenu(null)
              }}
            />
          ) : null}
        </Tabs.Content>

        <Tabs.Content value="flows" className="mt-4 space-y-3">
          <div className="flex justify-end">
            <Button type="button" onClick={() => openCreate("flow")}>
              Nouveau flow
            </Button>
          </div>
          <div className="space-y-2">
            {flows.map((f) => (
              <div key={f._id} className="flex flex-col gap-2 rounded-md border bg-card p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="text-sm font-semibold">{f.title}</div>
                  <div className="text-xs text-muted-foreground">{f.priceForDetailedReport} Ar</div>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => openEdit("flow", f)}>
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                    onClick={() => removeFlow(f)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Tabs.Content>
      </Tabs.Root>

      <CrudModal
        title={mode === "create" ? "Créer" : "Modifier"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={submit}
      >
        {entity === "flow" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Titre</label>
              <input
                value={flowForm.title}
                onChange={(e) => setFlowForm((p) => ({ ...p, title: e.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Description</label>
              <textarea
                value={flowForm.description}
                onChange={(e) => setFlowForm((p) => ({ ...p, description: e.target.value }))}
                className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Prix rapport détaillé</label>
              <input
                type="number"
                value={flowForm.priceForDetailedReport}
                onChange={(e) => setFlowForm((p) => ({ ...p, priceForDetailedReport: Number(e.target.value) }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Statut</label>
              <select
                value={flowForm.status}
                onChange={(e) => setFlowForm((p) => ({ ...p, status: e.target.value as any }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="draft">draft</option>
                <option value="published">published</option>
              </select>
            </div>
          </div>
        ) : null}

        {entity === "node" ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-sm font-medium">Type de node</label>
              <select
                value={nodeForm.type || "questionNode"}
                onChange={(e) => setNodeForm((p: any) => ({ ...p, type: e.target.value }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="questionNode">question</option>
                <option value="conditionNode">condition</option>
                <option value="actionNode">action</option>
                <option value="resultNode">result</option>
                <option value="alertNode">alert</option>
                <option value="flowNode">flow jump</option>
              </select>
            </div>

            {String(nodeForm.type || "questionNode") === "questionNode" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Label</label>
                  <input
                    value={nodeForm.data?.label || ""}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), label: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">fieldKey</label>
                  <input
                    value={nodeForm.data?.fieldKey || ""}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), fieldKey: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">inputType</label>
                  <select
                    value={nodeForm.data?.inputType || "select"}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), inputType: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="boolean">boolean</option>
                    <option value="select">select</option>
                    <option value="multi_select">multi_select</option>
                    <option value="text">text</option>
                    <option value="number">number</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">options (une par ligne)</label>
                  <textarea
                    value={nodeOptionsText}
                    onChange={(e) => setNodeOptionsText(e.target.value)}
                    onBlur={() => {
                      const normalized = nodeOptionsText
                        .split("\n")
                        .map((x) => x.trim())
                        .filter(Boolean)

                      setNodeForm((p: any) => ({
                        ...p,
                        data: {
                          ...(p.data || {}),
                          options: normalized,
                        },
                      }))
                    }}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-sm font-medium">AI tag</label>
                    <input
                      value={nodeForm.data?.aiMetadata?.tag || ""}
                      onChange={(e) =>
                        setNodeForm((p: any) => ({
                          ...p,
                          data: {
                            ...(p.data || {}),
                            aiMetadata: { ...(p.data?.aiMetadata || { weight: 1, includeInPrompt: false }), tag: e.target.value },
                          },
                        }))
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-medium">AI weight</label>
                    <input
                      type="number"
                      value={Number(nodeForm.data?.aiMetadata?.weight || 1)}
                      onChange={(e) =>
                        setNodeForm((p: any) => ({
                          ...p,
                          data: {
                            ...(p.data || {}),
                            aiMetadata: { ...(p.data?.aiMetadata || { tag: "", includeInPrompt: false }), weight: Number(e.target.value) },
                          },
                        }))
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={!!nodeForm.data?.aiMetadata?.includeInPrompt}
                    onChange={(e) =>
                      setNodeForm((p: any) => ({
                        ...p,
                        data: {
                          ...(p.data || {}),
                          aiMetadata: { ...(p.data?.aiMetadata || { tag: "", weight: 1 }), includeInPrompt: e.target.checked },
                        },
                      }))
                    }
                  />
                  Inclure dans prompt AI
                </label>
              </div>
            ) : null}

            {String(nodeForm.type || "") === "conditionNode" ? (
              <div className="space-y-3">
                {(() => {
                  const branches = Array.isArray(nodeForm.data?.branches) ? nodeForm.data.branches : []
                  const ensureMinBranches = () => {
                    if (branches.length >= 4) return branches
                    const next = [...branches]
                    for (let i = next.length; i < 4; i++) {
                      next.push({ key: `branch_${i + 1}`, logic: "AND", rules: [] })
                    }
                    return next
                  }

                  const normalizedBranches = ensureMinBranches()

                  const setBranches = (nextBranches: any[]) => {
                    setNodeForm((p: any) => ({
                      ...p,
                      data: {
                        ...(p.data || {}),
                        branches: nextBranches,
                      },
                    }))
                  }

                  return (
                    <div className="space-y-3">
                      <div className="space-y-1">
                        <label className="text-sm font-medium">Fallback branch</label>
                        <input
                          value={String(nodeForm.data?.fallbackBranchKey || "")}
                          onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), fallbackBranchKey: e.target.value } }))}
                          placeholder="default"
                          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <div className="text-sm font-medium">Branches</div>
                        {normalizedBranches.map((b: any, bIdx: number) => (
                          <div key={bIdx} className="space-y-2 rounded-md border bg-background/50 p-2">
                            <div className="grid gap-2 sm:grid-cols-3">
                              <input
                                value={String(b?.key || "")}
                                placeholder="branch key"
                                onChange={(e) => {
                                  const next = [...normalizedBranches]
                                  next[bIdx] = { ...next[bIdx], key: e.target.value }
                                  setBranches(next)
                                }}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                              />
                              <select
                                value={String(b?.logic || "AND")}
                                onChange={(e) => {
                                  const next = [...normalizedBranches]
                                  next[bIdx] = { ...next[bIdx], logic: e.target.value }
                                  setBranches(next)
                                }}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                              >
                                <option value="AND">AND</option>
                                <option value="OR">OR</option>
                              </select>
                              <Button
                                type="button"
                                variant="outline"
                                className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                onClick={() => {
                                  const next = [...normalizedBranches]
                                  next.splice(bIdx, 1)
                                  setBranches(next)
                                }}
                              >
                                Suppr branche
                              </Button>
                            </div>

                            <div className="grid gap-2 sm:grid-cols-3">
                              <select
                                value={String(b?.transition?.flowId || "")}
                                onChange={(e) => {
                                  const flowId = String(e.target.value || "")
                                  const next = [...normalizedBranches]
                                  const prevBranch = next[bIdx] || {}
                                  next[bIdx] = {
                                    ...prevBranch,
                                    transition: flowId
                                      ? { flowId, entry: { type: "start" } }
                                      : undefined,
                                  }
                                  setBranches(next)
                                }}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                              >
                                <option value="">(pas de transition)</option>
                                {flows
                                  .filter((f: any) => String(f?._id || "") !== String(flowId || ""))
                                  .map((f: any) => (
                                    <option key={String(f._id)} value={String(f._id)}>
                                      {String(f.title || f._id)}
                                    </option>
                                  ))}
                              </select>

                              <select
                                value={String(b?.transition?.entry?.type || "start")}
                                onChange={(e) => {
                                  const t = String(e.target.value || "start")
                                  const next = [...normalizedBranches]
                                  const prevBranch = next[bIdx] || {}
                                  const tr = prevBranch.transition && typeof prevBranch.transition === "object" ? prevBranch.transition : undefined
                                  if (!tr?.flowId) return
                                  next[bIdx] = {
                                    ...prevBranch,
                                    transition: {
                                      ...tr,
                                      entry: t === "node" ? { type: "node", nodeId: "" } : { type: "start" },
                                    },
                                  }
                                  setBranches(next)
                                }}
                                disabled={!b?.transition?.flowId}
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                              >
                                <option value="start">entrée: start</option>
                                <option value="node">entrée: nodeId</option>
                              </select>

                              <input
                                value={String(b?.transition?.entry?.type === "node" ? b?.transition?.entry?.nodeId || "" : "")}
                                onChange={(e) => {
                                  const next = [...normalizedBranches]
                                  const prevBranch = next[bIdx] || {}
                                  const tr = prevBranch.transition && typeof prevBranch.transition === "object" ? prevBranch.transition : undefined
                                  if (!tr?.flowId) return
                                  if (String(tr?.entry?.type || "start") !== "node") return
                                  next[bIdx] = {
                                    ...prevBranch,
                                    transition: { ...tr, entry: { type: "node", nodeId: e.target.value } },
                                  }
                                  setBranches(next)
                                }}
                                disabled={!b?.transition?.flowId || String(b?.transition?.entry?.type || "start") !== "node"}
                                placeholder="nodeId (optionnel)"
                                className="h-10 rounded-md border bg-background px-3 text-sm"
                              />
                            </div>

                            <div className="space-y-2">
                              {(Array.isArray(b?.rules) ? b.rules : []).map((r: any, idx: number) => (
                                <div key={idx} className="grid gap-2 sm:grid-cols-3">
                                  <input
                                    value={r.fieldKey || ""}
                                    placeholder="fieldKey"
                                    onChange={(e) => {
                                      const next = [...normalizedBranches]
                                      const rules = Array.isArray(next[bIdx]?.rules) ? [...next[bIdx].rules] : []
                                      rules[idx] = { ...rules[idx], fieldKey: e.target.value }
                                      next[bIdx] = { ...next[bIdx], rules }
                                      setBranches(next)
                                    }}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                  />
                                  <select
                                    value={r.operator || "equals"}
                                    onChange={(e) => {
                                      const next = [...normalizedBranches]
                                      const rules = Array.isArray(next[bIdx]?.rules) ? [...next[bIdx].rules] : []
                                      rules[idx] = { ...rules[idx], operator: e.target.value }
                                      next[bIdx] = { ...next[bIdx], rules }
                                      setBranches(next)
                                    }}
                                    className="h-10 rounded-md border bg-background px-3 text-sm"
                                  >
                                    <option value="equals">equals</option>
                                    <option value="not_equals">not_equals</option>
                                    <option value="greater_than">greater_than</option>
                                    <option value="less_than">less_than</option>
                                    <option value="includes">includes</option>
                                  </select>
                                  <input
                                    value={r.value || ""}
                                    placeholder="value"
                                    onChange={(e) => {
                                      const next = [...normalizedBranches]
                                      const rules = Array.isArray(next[bIdx]?.rules) ? [...next[bIdx].rules] : []
                                      rules[idx] = { ...rules[idx], value: e.target.value }
                                      next[bIdx] = { ...next[bIdx], rules }
                                      setBranches(next)
                                    }}
                                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                                  />
                                  <Button
                                    type="button"
                                    variant="outline"
                                    className="border-destructive/40 text-destructive hover:bg-destructive/10"
                                    onClick={() => {
                                      const next = [...normalizedBranches]
                                      const rules = Array.isArray(next[bIdx]?.rules) ? [...next[bIdx].rules] : []
                                      rules.splice(idx, 1)
                                      next[bIdx] = { ...next[bIdx], rules }
                                      setBranches(next)
                                    }}
                                  >
                                    Suppr
                                  </Button>
                                </div>
                              ))}

                              <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                  const next = [...normalizedBranches]
                                  const rules = Array.isArray(next[bIdx]?.rules) ? [...next[bIdx].rules] : []
                                  rules.push({ fieldKey: "", operator: "equals", value: "" })
                                  next[bIdx] = { ...next[bIdx], rules }
                                  setBranches(next)
                                }}
                              >
                                + Add rule
                              </Button>
                            </div>
                          </div>
                        ))}

                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => {
                            const next = [...normalizedBranches]
                            next.push({ key: `branch_${next.length + 1}`, logic: "AND", rules: [] })
                            setBranches(next)
                          }}
                        >
                          + Add branch
                        </Button>
                      </div>
                    </div>
                  )
                })()}
              </div>
            ) : null}

            {String(nodeForm.type || "") === "actionNode" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">actionType</label>
                  <select
                    value={nodeForm.data?.actionType || "call_ai"}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), actionType: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="call_ai">call_ai</option>
                    <option value="show_result">show_result</option>
                    <option value="redirect">redirect</option>
                  </select>
                </div>

                {String(nodeForm.data?.actionType || "") === "redirect" ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <select
                      value={String(nodeForm.data?.payload?.redirect?.target?.flowId || "")}
                      onChange={(e) => {
                        const targetFlowId = String(e.target.value || "")
                        setNodeForm((p: any) => ({
                          ...p,
                          data: {
                            ...(p.data || {}),
                            payload: {
                              ...((p.data || {}).payload || {}),
                              redirect: targetFlowId
                                ? { target: { flowId: targetFlowId, entry: { type: "start" } } }
                                : undefined,
                            },
                          },
                        }))
                      }}
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="">Choisir un flow...</option>
                      {flows.map((f: any) => (
                        <option key={String(f._id)} value={String(f._id)}>
                          {String(f.title || f._id)}
                        </option>
                      ))}
                    </select>

                    <select
                      value={String(nodeForm.data?.payload?.redirect?.target?.entry?.type || "start")}
                      onChange={(e) => {
                        const t = String(e.target.value || "start")
                        setNodeForm((p: any) => {
                          const cur = (p.data || {}).payload?.redirect?.target
                          if (!cur?.flowId) return p
                          return {
                            ...p,
                            data: {
                              ...(p.data || {}),
                              payload: {
                                ...((p.data || {}).payload || {}),
                                redirect: { target: { ...cur, entry: t === "node" ? { type: "node", nodeId: "" } : { type: "start" } } },
                              },
                            },
                          }
                        })
                      }}
                      disabled={!nodeForm.data?.payload?.redirect?.target?.flowId}
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    >
                      <option value="start">entrée: start</option>
                      <option value="node">entrée: nodeId</option>
                    </select>

                    <input
                      value={String(
                        nodeForm.data?.payload?.redirect?.target?.entry?.type === "node"
                          ? nodeForm.data?.payload?.redirect?.target?.entry?.nodeId || ""
                          : "",
                      )}
                      onChange={(e) => {
                        setNodeForm((p: any) => {
                          const cur = (p.data || {}).payload?.redirect?.target
                          if (!cur?.flowId) return p
                          if (String(cur?.entry?.type || "start") !== "node") return p
                          return {
                            ...p,
                            data: {
                              ...(p.data || {}),
                              payload: {
                                ...((p.data || {}).payload || {}),
                                redirect: { target: { ...cur, entry: { type: "node", nodeId: e.target.value } } },
                              },
                            },
                          }
                        })
                      }}
                      disabled={String(nodeForm.data?.payload?.redirect?.target?.entry?.type || "start") !== "node"}
                      placeholder="nodeId"
                      className="h-10 rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}

            {String(nodeForm.type || "") === "resultNode" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Titre</label>
                  <input
                    value={nodeForm.data?.title || ""}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), title: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    value={nodeForm.data?.description || ""}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), description: e.target.value } }))}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>
              </div>
            ) : null}

            {String(nodeForm.type || "") === "alertNode" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Texte (rouge)</label>
                  <textarea
                    value={nodeForm.data?.text || ""}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), text: e.target.value } }))}
                    className="min-h-24 w-full rounded-md border bg-background px-3 py-2 text-sm"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Couleur</label>
                  <select
                    value={String(nodeForm.data?.color || "red")}
                    onChange={(e) => setNodeForm((p: any) => ({ ...p, data: { ...(p.data || {}), color: e.target.value } }))}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="red">red</option>
                    <option value="green">green</option>
                  </select>
                </div>
              </div>
            ) : null}

            {String(nodeForm.type || "questionNode") === "flowNode" ? (
              <div className="space-y-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium">Flow cible</label>
                  <select
                    value={String(nodeForm.data?.target?.flowId || "")}
                    onChange={(e) => {
                      const fid = String(e.target.value || "")
                      setNodeForm((p: any) => ({
                        ...p,
                        data: {
                          ...(p.data || {}),
                          target: {
                            ...((p.data || {}).target || {}),
                            flowId: fid,
                          },
                        },
                      }))
                    }}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="">Choisir un flow</option>
                    {flows
                      .filter((f: any) => String(f._id) !== String(flowId))
                      .map((f: any) => (
                        <option key={String(f._id)} value={String(f._id)}>
                          {String(f.title || f._id)}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-sm font-medium">Entry</label>
                  <select
                    value={String(nodeForm.data?.target?.entry?.type || "start")}
                    onChange={(e) => {
                      const t = String(e.target.value || "start")
                      setNodeForm((p: any) => ({
                        ...p,
                        data: {
                          ...(p.data || {}),
                          target: {
                            ...((p.data || {}).target || {}),
                            entry: t === "node" ? { type: "node", nodeId: "" } : { type: "start" },
                          },
                        },
                      }))
                    }}
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  >
                    <option value="start">start</option>
                    <option value="node">node</option>
                  </select>
                </div>

                {String(nodeForm.data?.target?.entry?.type || "start") === "node" ? (
                  <div className="space-y-1">
                    <label className="text-sm font-medium">NodeId (dans le flow cible)</label>
                    <input
                      value={String(nodeForm.data?.target?.entry?.nodeId || "")}
                      onChange={(e) =>
                        setNodeForm((p: any) => ({
                          ...p,
                          data: {
                            ...(p.data || {}),
                            target: {
                              ...((p.data || {}).target || {}),
                              entry: { type: "node", nodeId: e.target.value },
                            },
                          },
                        }))
                      }
                      className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}
      </CrudModal>
    </div>
  )
}
