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

export function QuestionForm({ flowId, onBack, onEvaluated, onRedirect }: Props) {
  const [questions, setQuestions] = React.useState<Extract<FlowNodeDTO, { type: "question" }>[]>([])
  const [answers, setAnswers] = React.useState<Record<string, string | string[] | boolean | number>>({})
  const [loading, setLoading] = React.useState(true)
  const [submitting, setSubmitting] = React.useState(false)
  const [terminalAlert, setTerminalAlert] = React.useState(false)
  const [preview, setPreview] = React.useState<Pick<
    FlowRunResultDTO,
    "resultType" | "resultColor" | "resultTitle" | "resultDescription"
  > | null>(null)
  const [autoSubmitError, setAutoSubmitError] = React.useState<string | null>(null)

  const fetchControllerRef = React.useRef<AbortController | null>(null)
  const evalControllerRef = React.useRef<AbortController | null>(null)
  const autoSubmitKeyRef = React.useRef<string>("")

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

      setAnswers({})
      setQuestions([] as any)
      setTerminalAlert(false)
      setPreview(null)
      setAutoSubmitError(null)
      autoSubmitKeyRef.current = ""

      if (onRedirect) {
        onRedirect(nextFlowId)
        return true
      }

      return false
    },
    [onRedirect],
  )

  const fetchQuestions = React.useCallback(
    async (nextAnswers: Record<string, string | string[] | boolean | number>) => {
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
      return {
        questions: (data?.questions || []) as any[],
        terminalAlert: !!data?.terminalAlert,
        preview: {
          resultType: data?.resultType,
          resultColor: data?.resultColor,
          resultTitle: data?.resultTitle,
          resultDescription: data?.resultDescription,
        } as any,
      }
    },
    [flowId],
  )

  React.useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        if (mounted) {
          const r = await fetchQuestions({})
          setQuestions(r.questions as any)
          setTerminalAlert(!!r.terminalAlert)
          setPreview(r.preview || null)
        }
      } catch (err: any) {
        if (err?.name !== "AbortError") {
          toast.error(err?.message || "Erreur lors du chargement des questions")
        }
      } finally {
        if (mounted) {
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
    let cancelled = false
    const t = setTimeout(() => {
      ;(async () => {
        try {
          const r = await fetchQuestions(answers)
          if (!cancelled) {
            setQuestions(r.questions as any)
            setTerminalAlert(!!r.terminalAlert)
            setPreview(r.preview || null)
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
  }, [answers, fetchQuestions])

  const updateAnswer = (fieldKey: string, value: string | string[] | boolean | number) => {
    setAnswers((prev) => ({ ...prev, [fieldKey]: value }))
  }

  React.useEffect(() => {
    if (!terminalAlert) return
    if (submitting) return
    if (autoSubmitError) return

    const key = JSON.stringify({ flowId, answers, t: preview?.resultType, id: (preview as any)?.resultNodeId })
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
          body: JSON.stringify({ flowId, answers }),
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
  }, [terminalAlert, submitting, autoSubmitError, flowId, answers, onEvaluated, preview])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!questions.length) return

    setSubmitting(true)

    try {
      const res = await fetch("/api/verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flowId, answers }),
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

  if (!questions.length) {
    return (
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div className="text-sm text-muted-foreground">Aucune question configurée pour ce flux.</div>
        <Button type="button" variant="outline" onClick={onBack}>
          Retour
        </Button>
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-6 rounded-xl border bg-card p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div className="text-lg font-semibold">Questions</div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Retour
        </Button>
      </div>

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
            const options = Array.isArray(q.data.options) ? q.data.options : []
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

          const options = Array.isArray(q.data.options) ? q.data.options : []

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
            <Button type="submit" variant="outline" disabled={submitting}>
              Relancer l'analyse
            </Button>
          </div>
        </div>
      ) : null}

      <Button type="submit" disabled={submitting}>
        {submitting ? "Analyse en cours..." : "Analyser"}
      </Button>
    </form>
  )
}
