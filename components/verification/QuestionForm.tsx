"use client"

import * as React from "react"
import { toast } from "sonner"

import type { FlowNodeDTO, FlowRunResultDTO } from "@/types"

import { Button } from "@/components/ui/button"

type Props = {
  flowId: string
  onBack: () => void
  onEvaluated: (result: FlowRunResultDTO) => void
  onRedirect?: (targetFlowId: string) => void
}

type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue }

export function QuestionForm({ flowId, onBack, onEvaluated, onRedirect }: Props) {
  const [questions, setQuestions] = React.useState<Extract<FlowNodeDTO, { type: "question" }>[]>([])
  const [historyQuestions, setHistoryQuestions] = React.useState<Extract<FlowNodeDTO, { type: "question" }>[]>([])
  const [historyAnswers, setHistoryAnswers] = React.useState<Record<string, JsonValue>>({})
  const [answers, setAnswers] = React.useState<Record<string, JsonValue>>({})
  const [confirmedAnswers, setConfirmedAnswers] = React.useState<
    Record<string, JsonValue>
  >({})
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [terminalAlert, setTerminalAlert] = React.useState(false)
  const [pendingUploadNodeId, setPendingUploadNodeId] = React.useState<string>("")
  const [uploadNode, setUploadNode] = React.useState<any>(null)
  const [uploadFile, setUploadFile] = React.useState<File | null>(null)
  const [pendingActionType, setPendingActionType] = React.useState<string>("")
  const [pendingVisionNodeId, setPendingVisionNodeId] = React.useState<string>("")
  const [preview, setPreview] = React.useState<Pick<
    FlowRunResultDTO,
    "resultType" | "resultColor" | "resultTitle" | "resultDescription"
  > | null>(null)
  const [autoSubmitError, setAutoSubmitError] = React.useState<string | null>(null)

  const fetchControllerRef = React.useRef<AbortController | null>(null)
  const evalControllerRef = React.useRef<AbortController | null>(null)
  const autoSubmitKeyRef = React.useRef<string>("")
  const autoNoQuestionSubmitKeyRef = React.useRef<string>("")
  const visionAutoInFlightRef = React.useRef(false)
  const noQuestionAutoInFlightRef = React.useRef(false)
  const prevFlowIdRef = React.useRef<string>(flowId)
  const didInitialLoadRef = React.useRef(false)

  const handleContinuation = React.useCallback(
    async (res: FlowRunResultDTO) => {
      const target =
        res?.actionType === "redirect"
          ? (res as any)?.redirect?.target
          : res?.actionType === "transition"
            ? (res as any)?.transition
            : null

      const nextFlowId = target && typeof target === "object" ? String((target as any).flowId || "") : ""
      if (!nextFlowId) return false

      if (onRedirect) {
        onRedirect(nextFlowId)
        return true
      }
      return false
    },
    [onRedirect],
  )

  React.useEffect(() => {
    if (loading) return
    if (pendingUploadNodeId) return
    if (questions.length) return
    if (!pendingVisionNodeId) return
    if (visionAutoInFlightRef.current) return

    setSubmitting(true)
    visionAutoInFlightRef.current = true
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch("/api/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId, answers: confirmedAnswers }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Erreur")
        }

        if (cancelled) return

        const parsed = data as FlowRunResultDTO
        const continued = await handleContinuation(parsed)
        if (!continued) onEvaluated(parsed)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(err?.message || "Erreur")
        }
      } finally {
        visionAutoInFlightRef.current = false
        if (!cancelled) setSubmitting(false)
      }
    })()

    return () => {
      cancelled = true
      visionAutoInFlightRef.current = false
    }
  }, [loading, pendingUploadNodeId, questions.length, pendingVisionNodeId, flowId, confirmedAnswers, handleContinuation, onEvaluated])

  React.useEffect(() => {
    if (loading) return
    if (pendingUploadNodeId) return
    if (questions.length) return
    if (pendingVisionNodeId) return

    if (noQuestionAutoInFlightRef.current) return

    const shouldAutoSubmit = pendingActionType === "show_result" || pendingActionType === "call_ai"
    if (!shouldAutoSubmit) return

    const key = JSON.stringify({ flowId, answers: confirmedAnswers, actionType: pendingActionType })
    if (autoNoQuestionSubmitKeyRef.current === key) return
    autoNoQuestionSubmitKeyRef.current = key

    setSubmitting(true)
    noQuestionAutoInFlightRef.current = true
    let cancelled = false

    ;(async () => {
      try {
        const res = await fetch("/api/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId, answers: confirmedAnswers }),
        })

        const data = await res.json()
        if (!res.ok) {
          throw new Error(data?.error || "Erreur")
        }

        if (cancelled) return

        const parsed = data as FlowRunResultDTO
        const continued = await handleContinuation(parsed)
        if (!continued) onEvaluated(parsed)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(err?.message || "Erreur")
        }
      } finally {
        noQuestionAutoInFlightRef.current = false
        if (!cancelled) setSubmitting(false)
      }
    })()

    return () => {
      cancelled = true
      noQuestionAutoInFlightRef.current = false
    }
  }, [loading, pendingUploadNodeId, questions.length, pendingVisionNodeId, pendingActionType, flowId, confirmedAnswers, handleContinuation, onEvaluated])

  React.useEffect(() => {
    const hasActiveMultiSelect = questions.some((q) => String((q as any)?.data?.inputType || "") === "multi_select")
    if (hasActiveMultiSelect) return
    setConfirmedAnswers(answers)
  }, [answers, questions])

  const fetchQuestions = React.useCallback(
    async (nextAnswers: Record<string, JsonValue>) => {
      fetchControllerRef.current?.abort()
      const controller = new AbortController()
      fetchControllerRef.current = controller

      const res = await fetch(`/api/verification/${flowId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: nextAnswers }),
        signal: controller.signal,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Erreur")
      }

      const resolvedFlowId = typeof (data as any)?.resolvedFlowId === "string" ? String((data as any).resolvedFlowId).trim() : ""

      if (resolvedFlowId && resolvedFlowId !== String(flowId)) {
        if (onRedirect) {
          onRedirect(resolvedFlowId)
        }
        return {
          redirected: true,
          questions: [] as any[],
          terminalAlert: false,
          preview: null,
        }
      }
      return {
        redirected: false,
        questions: (data?.questions || []) as any[],
        pendingUploadNodeId: typeof (data as any)?.pendingUploadNodeId === "string" ? String((data as any).pendingUploadNodeId) : "",
        uploadNode: (data as any)?.uploadNode || null,
        actionType: typeof (data as any)?.actionType === "string" ? String((data as any).actionType) : "",
        pendingVisionNodeId: typeof (data as any)?.pendingVisionNodeId === "string" ? String((data as any).pendingVisionNodeId) : "",
        terminalAlert: !!data?.terminalAlert,
        preview: {
          resultType: data?.resultType,
          resultColor: data?.resultColor,
          resultTitle: data?.resultTitle,
          resultDescription: data?.resultDescription,
        } as any,
      }
    },
    [flowId, onRedirect],
  )

  React.useEffect(() => {
    let mounted = true

    if (prevFlowIdRef.current && prevFlowIdRef.current !== flowId && questions.length) {
      const toAdd = questions
      setHistoryQuestions((prev) => {
        return [...prev, ...toAdd]
      })

      setHistoryAnswers((prev) => ({ ...prev, ...answers }))

      setAnswers({})
      setConfirmedAnswers({})
      setTerminalAlert(false)
      setPreview(null)
      setAutoSubmitError(null)
      autoSubmitKeyRef.current = ""
    }
    prevFlowIdRef.current = flowId

    ;(async () => {
      try {
        if (mounted) {
          const r = await fetchQuestions({})
          if (!r.redirected) {
            setQuestions(r.questions as any)
            setPendingUploadNodeId(String((r as any)?.pendingUploadNodeId || ""))
            setUploadNode((r as any)?.uploadNode || null)
            setPendingActionType(String((r as any)?.actionType || ""))
            setPendingVisionNodeId(String((r as any)?.pendingVisionNodeId || ""))
            setTerminalAlert(!!r.terminalAlert)
            setPreview(r.preview || null)
          }
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(err?.message || "Erreur lors du chargement des questions")
        }
      } finally {
        if (mounted) {
          didInitialLoadRef.current = true
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
      fetchControllerRef.current?.abort()
      evalControllerRef.current?.abort()
    }
  }, [flowId])

  React.useEffect(() => {
    if (!didInitialLoadRef.current) return
    if (loading) return

    const hasActiveMultiSelect = questions.some((q) => String((q as any)?.data?.inputType || "") === "multi_select")
    const pendingMultiSelectChange = hasActiveMultiSelect && JSON.stringify(answers) !== JSON.stringify(confirmedAnswers)
    if (pendingMultiSelectChange) return

    let cancelled = false
    const t = setTimeout(() => {
      ;(async () => {
        try {
          const r = await fetchQuestions(confirmedAnswers)
          if (!cancelled) {
            if (!r.redirected) {
              setQuestions(r.questions as any)
              setPendingUploadNodeId(String((r as any)?.pendingUploadNodeId || ""))
              setUploadNode((r as any)?.uploadNode || null)
              setPendingActionType(String((r as any)?.actionType || ""))
              setPendingVisionNodeId(String((r as any)?.pendingVisionNodeId || ""))
              setTerminalAlert(!!r.terminalAlert)
              setPreview(r.preview || null)
            }
          }
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            toast.error(err?.message || "Erreur lors du chargement des questions")
          }
        }
      })()
    }, 200)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [answers, confirmedAnswers, fetchQuestions, loading])

  const updateAnswer = (fieldKey: string, value: JsonValue) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }))
  }

  const submitUpload = async (e: React.FormEvent) => {
    e.preventDefault()

    const fieldKey = String(uploadNode?.data?.fieldKey || "")
    if (!fieldKey) {
      toast.error("Upload node invalide")
      return
    }

    if (!uploadFile) {
      toast.error("Fichier requis")
      return
    }

    setSubmitting(true)
    try {
      const form = new FormData()
      form.set("file", uploadFile)

      const res = await fetch("/api/verification/upload", {
        method: "POST",
        body: form,
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data?.error || "Erreur")
      }

      const fileUrl = String(data?.fileUrl || "")
      if (!fileUrl) {
        throw new Error("Upload échoué")
      }

      const nextAnswers = { ...confirmedAnswers, [fieldKey]: fileUrl }
      setUploadFile(null)
      setAnswers(nextAnswers)
      setConfirmedAnswers(nextAnswers)

      const r = await fetchQuestions(nextAnswers)
      if (!r.redirected) {
        setQuestions(r.questions as any)
        setPendingUploadNodeId(String((r as any)?.pendingUploadNodeId || ""))
        setUploadNode((r as any)?.uploadNode || null)
        setPendingActionType(String((r as any)?.actionType || ""))
        setPendingVisionNodeId(String((r as any)?.pendingVisionNodeId || ""))
        setTerminalAlert(!!r.terminalAlert)
        setPreview(r.preview || null)
      }
    } catch (err: any) {
      toast.error(err?.message || "Erreur")
    } finally {
      setSubmitting(false)
    }
  }

  React.useEffect(() => {
    if (!terminalAlert) return
    if (submitting) return
    if (autoSubmitError) return

    const hasActiveMultiSelect = questions.some((q) => String((q as any)?.data?.inputType || "") === "multi_select")
    const pendingMultiSelectChange = hasActiveMultiSelect && JSON.stringify(answers) !== JSON.stringify(confirmedAnswers)
    if (pendingMultiSelectChange) return

    const key = JSON.stringify({ flowId, answers: confirmedAnswers, t: preview?.resultType, id: (preview as any)?.resultNodeId })
    if (autoSubmitKeyRef.current === key) return
    autoSubmitKeyRef.current = key

    setSubmitting(true)

    evalControllerRef.current?.abort()
    const controller = new AbortController()
    evalControllerRef.current = controller

    ;(async () => {
      try {
        const res = await fetch("/api/verification", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ flowId, answers: confirmedAnswers }),
          signal: controller.signal,
        })

        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Erreur")
        }

        const parsed = data as FlowRunResultDTO
        const continued = await handleContinuation(parsed)
        if (!continued) onEvaluated(parsed)
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          const msg = err?.message || "Erreur lors de l'évaluation"
          setAutoSubmitError(msg)
          toast.error(msg)
        }
      } finally {
        setSubmitting(false)
      }
    })()
  }, [terminalAlert, submitting, autoSubmitError, flowId, answers, confirmedAnswers, onEvaluated, preview, questions])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!questions.length) return

    setSubmitting(true)

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId, answers: confirmedAnswers }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data?.error || "Erreur")
      }

      const parsed = data as FlowRunResultDTO
      const continued = await handleContinuation(parsed)
      if (!continued) onEvaluated(parsed)
    } catch (err: any) {
      toast.error(err?.message || "Erreur lors de l'évaluation")
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Chargement...</div>
  }

  if (pendingUploadNodeId && uploadNode) {
    const label = String(uploadNode?.data?.label || "Upload fichier")
    const accept = typeof uploadNode?.data?.accept === "string" ? uploadNode.data.accept : ""

    return (
      <form onSubmit={submitUpload} className="space-y-4 rounded-xl border bg-card p-6">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div className="text-lg font-semibold">{label}</div>
          <Button type="button" variant="outline" size="sm" onClick={onBack}>
            Retour
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Fichier</label>
          <input
            type="file"
            accept={accept || undefined}
            onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
            className="block w-full text-sm"
          />
        </div>

        <Button type="submit" disabled={submitting}>
          {submitting ? "Envoi..." : "Envoyer"}
        </Button>
      </form>
    )
  }

  if (!questions.length) {
    if (submitting || pendingVisionNodeId || pendingActionType === "show_result" || pendingActionType === "call_ai") {
      return (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          <div className="text-sm text-muted-foreground">Analyse en cours...</div>
          <Button type="button" variant="outline" onClick={onBack} disabled={submitting}>
            Retour
          </Button>
        </div>
      )
    }
    return (
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">Aucune question configurée pour ce flux.</div>
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>
    )
  }

  const hasActiveMultiSelect = questions.some((q) => String((q as any)?.data?.inputType || "") === "multi_select")
  const pendingMultiSelectChange = hasActiveMultiSelect && JSON.stringify(answers) !== JSON.stringify(confirmedAnswers)

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="text-lg font-semibold">Questions</div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Retour
        </Button>
      </div>

      {historyQuestions.length ? (
        <div className="space-y-4">
          {historyQuestions.map((q) => {
            const fieldKey = q.data.fieldKey
            const label = q.data.label || q.data.fieldKey
            const value = historyAnswers[fieldKey]

            if (q.data.inputType === "boolean") {
              return (
                <div key={q.id} className="space-y-2 opacity-80">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name={fieldKey} checked={value === true} readOnly disabled />
                      <span>Oui</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm">
                      <input type="radio" name={fieldKey} checked={value === false} readOnly disabled />
                      <span>Non</span>
                    </label>
                  </div>
                </div>
              )
            }

            if (q.data.inputType === "text") {
              return (
                <div key={q.id} className="space-y-2 opacity-80">
                  <div className="text-sm font-medium">{label}</div>
                  <input
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={typeof value === "string" ? value : ""}
                    readOnly
                    disabled
                  />
                </div>
              )
            }

            if (q.data.inputType === "number") {
              return (
                <div key={q.id} className="space-y-2 opacity-80">
                  <div className="text-sm font-medium">{label}</div>
                  <input
                    type="number"
                    className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                    value={typeof value === "number" ? value : value === undefined ? "" : String(value)}
                    readOnly
                    disabled
                  />
                </div>
              )
            }

            if (q.data.inputType === "multi_select") {
              const rawOptions = Array.isArray(q.data.options) ? q.data.options : []
              const options = rawOptions
                .map((o: any) => {
                  if (typeof o === "string") return { id: o, label: o, maxCount: undefined as number | undefined }
                  const id = String(o?.id || o?.label || "").trim()
                  const label = String(o?.label || o?.id || "").trim()
                  const max = o?.maxCount
                  const maxCount = typeof max === "number" && Number.isFinite(max) && max > 0 ? Math.floor(max) : undefined
                  if (!id || !label) return null
                  return { id, label, maxCount }
                })
                .filter(Boolean) as { id: string; label: string; maxCount?: number }[]

              const counts: Record<string, number> =
                value && typeof value === "object" && !Array.isArray(value)
                  ? Object.fromEntries(
                      Object.entries(value as any).map(([k, v]) => [String(k), typeof v === "number" && Number.isFinite(v) ? v : 0]),
                    )
                  : Array.isArray(value)
                    ? (value.filter((v): v is string => typeof v === "string").reduce((acc: any, v: string) => {
                        acc[v] = (acc[v] || 0) + 1
                        return acc
                      }, {}) as Record<string, number>)
                    : {}

              return (
                <div key={q.id} className="space-y-2 opacity-80">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="flex flex-col gap-2">
                    {options.map((opt) => {
                      const c = counts[opt.id] || 0
                      return (
                        <div key={opt.id} className="flex items-center justify-between gap-3 rounded-md border bg-background/50 px-3 py-2">
                          <div className="min-w-0 truncate text-sm">{opt.label}</div>
                          <div className="w-10 text-right text-sm tabular-nums">{c}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            }

            const options = (Array.isArray(q.data.options) ? q.data.options : [])
              .map((o: any) => (typeof o === "string" ? o : String(o?.label || o?.id || "").trim()))
              .filter((x: any) => typeof x === "string" && x.trim() !== "") as string[]
            return (
              <div key={q.id} className="space-y-2 opacity-80">
                <div className="text-sm font-medium">{label}</div>
                <select
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={typeof value === "string" ? value : ""}
                  disabled
                >
                  <option value="">Sélectionner...</option>
                  {options.map((opt: string) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            )
          })}
        </div>
      ) : null}

      <div className="space-y-4">
        {questions.map((q) => {
          const fieldKey = q.data.fieldKey
          const label = q.data.label || q.data.fieldKey
          const value = answers[fieldKey]

          if (q.data.inputType === "boolean") {
            return (
              <div key={q.id} className="space-y-2">
                <div className="text-sm font-medium">{label}</div>
                <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={fieldKey}
                      checked={value === true}
                      onChange={() => updateAnswer(fieldKey, true)}
                    />
                    <span>Oui</span>
                  </label>
                  <label className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name={fieldKey}
                      checked={value === false}
                      onChange={() => updateAnswer(fieldKey, false)}
                    />
                    <span>Non</span>
                  </label>
                </div>
              </div>
            )
          }

          if (q.data.inputType === "text") {
            return (
              <div key={q.id} className="space-y-2">
                <div className="text-sm font-medium">{label}</div>
                <input
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={typeof value === "string" ? value : ""}
                  onChange={(e) => updateAnswer(fieldKey, e.target.value)}
                />
              </div>
            )
          }

          if (q.data.inputType === "number") {
            return (
              <div key={q.id} className="space-y-2">
                <div className="text-sm font-medium">{label}</div>
                <input
                  type="number"
                  className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                  value={typeof value === "number" ? value : value === undefined ? "" : String(value)}
                  onChange={(e) => {
                    const raw = e.target.value
                    updateAnswer(fieldKey, raw === "" ? "" : Number(raw))
                  }}
                />
              </div>
            )
          }

          if (q.data.inputType === "multi_select") {
            const allowQuantity = !!(q as any)?.data?.allowQuantity

            if (!allowQuantity) {
              const options = (Array.isArray(q.data.options) ? q.data.options : [])
                .map((o: any) => (typeof o === "string" ? o : String(o?.label || o?.id || "").trim()))
                .filter((x: any) => typeof x === "string" && x.trim() !== "") as string[]

              const selected = Array.isArray(value) ? value.filter((v): v is string => typeof v === "string") : []
              const toggle = (opt: string) => {
                const next = selected.includes(opt) ? selected.filter((x) => x !== opt) : [...selected, opt]
                updateAnswer(fieldKey, next)
              }

              return (
                <div key={q.id} className="space-y-2">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="flex flex-col gap-2">
                    {options.map((opt) => (
                      <label key={opt} className="flex cursor-pointer items-center gap-2 text-sm">
                        <input type="checkbox" checked={selected.includes(opt)} onChange={() => toggle(opt)} />
                        <span>{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )
            }

            const rawOptions = Array.isArray(q.data.options) ? q.data.options : []
            const options = rawOptions
              .map((o: any) => {
                if (typeof o === "string") return { id: o, label: o, maxCount: undefined as number | undefined }
                const id = String(o?.id || o?.label || "").trim()
                const label = String(o?.label || o?.id || "").trim()
                const max = o?.maxCount
                const maxCount = typeof max === "number" && Number.isFinite(max) && max > 0 ? Math.floor(max) : undefined
                if (!id || !label) return null
                return { id, label, maxCount }
              })
              .filter(Boolean) as { id: string; label: string; maxCount?: number }[]

            const counts: Record<string, number> =
              value && typeof value === "object" && !Array.isArray(value)
                ? Object.fromEntries(
                    Object.entries(value as any).map(([k, v]) => [String(k), typeof v === "number" && Number.isFinite(v) ? v : 0]),
                  )
                : {}

            const setCount = (optId: string, nextCount: number) => {
              const safe = Math.max(0, Math.floor(nextCount || 0))
              const next = { ...counts, [optId]: safe }
              if (!safe) delete (next as any)[optId]
              updateAnswer(fieldKey, next)
            }

            return (
              <div key={q.id} className="space-y-2">
                <div className="text-sm font-medium">{label}</div>
                <div className="flex flex-col gap-2">
                  {options.map((opt) => {
                    const current = counts[opt.id] || 0
                    const maxed = typeof opt.maxCount === "number" ? current >= opt.maxCount : false

                    return (
                      <div key={opt.id} className="flex items-center justify-between gap-3 rounded-md border bg-background/50 px-3 py-2">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium">{opt.label}</div>
                          {typeof opt.maxCount === "number" ? (
                            <div className="text-xs text-muted-foreground">max: {opt.maxCount}</div>
                          ) : null}
                        </div>

                        <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={() => setCount(opt.id, current - 1)} disabled={current <= 0}>
                            -
                          </Button>
                          <div className="w-8 text-center text-sm tabular-nums">{current}</div>
                          <Button type="button" variant="outline" size="sm" onClick={() => setCount(opt.id, current + 1)} disabled={maxed}>
                            +
                          </Button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          }

          const options = (Array.isArray(q.data.options) ? q.data.options : [])
            .map((o: any) => (typeof o === "string" ? o : String(o?.label || o?.id || "").trim()))
            .filter((x: any) => typeof x === "string" && x.trim() !== "") as string[]

          return (
            <div key={q.id} className="space-y-2">
              <div className="text-sm font-medium">{label}</div>
              <select
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
                value={typeof value === "string" ? value : ""}
                onChange={(e) => updateAnswer(fieldKey, e.target.value)}
              >
                <option value="">Sélectionner...</option>
                {options.map((opt: string) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )
        })}
      </div>

      {pendingMultiSelectChange ? (
        <Button
          type="button"
          className="w-full"
          onClick={() => {
            setConfirmedAnswers(answers)
          }}
        >
          Valider les sélections
        </Button>
      ) : null}

      {preview?.resultType === "alert" && preview.resultDescription ? (
        <div className="rounded-lg border p-4">
          <div
            className={
              preview.resultColor === "green" ? "text-sm font-semibold text-green-700" : "text-sm font-semibold text-red-700"
            }
          >
            {preview.resultTitle || "Avertissement"}
          </div>
          <div
            className={
              preview.resultColor === "green" ? "mt-1 whitespace-pre-wrap text-sm text-green-600" : "mt-1 whitespace-pre-wrap text-sm text-red-600"
            }
          >
            {preview.resultDescription}
          </div>
        </div>
      ) : null}

      {autoSubmitError ? (
        <div className="text-sm text-destructive">
          {autoSubmitError}
          <div className="mt-2">
            <Button
              type="submit"
              variant="outline"
              disabled={submitting || pendingMultiSelectChange || (Array.isArray(questions) && questions.length > 0)}
            >
              Relancer l'analyse
            </Button>
          </div>
        </div>
      ) : null}

      <Button
        type="submit"
        disabled={submitting || pendingMultiSelectChange || (Array.isArray(questions) && questions.length > 0)}
      >
        {submitting ? "Analyse en cours..." : "Analyser"}
      </Button>
    </form>
  )
}
