"use client"

import * as React from "react"

import type { FlowRunResultDTO, VerificationFlowDTO } from "@/types"

import { Badge } from "@/components/ui/badge"
import { FlowSelector } from "@/components/verification/FlowSelector"
import { QuestionForm } from "@/components/verification/QuestionForm"
import { VerificationSummary } from "@/components/verification/VerificationSummary"
import { VerificationMvolaStep } from "@/components/verification/VerificationMvolaStep"
import { VerificationProofUpload } from "@/components/verification/VerificationProofUpload"
import { VerificationConfirmation } from "@/components/verification/VerificationConfirmation"

type Props = {
  userId: string
}

type StepId = 1 | 2 | 3 | 4 | 5 | 6

export function VerificationStepper({ userId }: Props) {
  const [step, setStep] = React.useState<StepId>(1)
  const [flow, setFlow] = React.useState<VerificationFlowDTO | null>(null)
  const [evaluation, setEvaluation] = React.useState<FlowRunResultDTO | null>(null)

  const steps: { id: StepId; label: string; hidden?: boolean }[] = [
    { id: 1, label: "Flux" },
    { id: 2, label: "Questions" },
    { id: 3, label: "Résumé" },
    { id: 4, label: "MVola", hidden: evaluation?.actionType !== "call_ai" },
    { id: 5, label: "Preuve", hidden: evaluation?.actionType !== "call_ai" },
    { id: 6, label: "Confirmation" },
  ]

  const visibleSteps = steps.filter((s) => !s.hidden)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {visibleSteps.map((s) => (
          <Badge key={s.id} variant={step === s.id ? "default" : "outline"}>
            {s.id}. {s.label}
          </Badge>
        ))}
      </div>

      {step === 1 ? (
        <FlowSelector
          onSelect={(selectedFlow) => {
            setFlow(selectedFlow)
            setEvaluation(null)
            setStep(2)
          }}
        />
      ) : null}

      {step === 2 && flow ? (
        <QuestionForm
          flowId={flow._id}
          onBack={() => {
            setStep(1)
          }}
          onRedirect={async (targetFlowId) => {
            try {
              const res = await fetch("/api/verification")
              const data = await res.json()
              const list = Array.isArray(data?.flows) ? data.flows : []
              const next = list.find((f: any) => String(f?._id || "") === String(targetFlowId))
              setFlow(next || ({ ...(flow as any), _id: targetFlowId } as any))
            } catch {
              setFlow({ ...(flow as any), _id: targetFlowId } as any)
            } finally {
              setEvaluation(null)
              setStep(2)
            }
          }}
          onEvaluated={(res) => {
            ;(async () => {
              const resolvedFlowId = String((res as any)?.resolvedFlowId || "").trim()
              if (resolvedFlowId && resolvedFlowId !== String(flow._id)) {
                try {
                  const r = await fetch("/api/verification")
                  const d = await r.json()
                  const list = Array.isArray(d?.flows) ? d.flows : []
                  const resolved = list.find((f: any) => String(f?._id || "") === resolvedFlowId)
                  if (resolved) setFlow(resolved)
                  else setFlow({ ...(flow as any), _id: resolvedFlowId } as any)
                } catch {
                  setFlow({ ...(flow as any), _id: resolvedFlowId } as any)
                }
              }

              setEvaluation(res)
              setStep(3)
            })()
          }}
        />
      ) : null}

      {step === 3 && flow && evaluation ? (
        <VerificationSummary
          flow={flow}
          result={evaluation}
          onBack={() => {
            setStep(2)
          }}
          onRequestPremium={() => {
            if (evaluation?.actionType === "call_ai") setStep(4)
            else setStep(6)
          }}
        />
      ) : null}

      {step === 4 && flow && evaluation?.actionType === "call_ai" ? (
        <VerificationMvolaStep
          flow={flow}
          userId={userId}
          onNext={() => {
            setStep(5)
          }}
        />
      ) : null}

      {step === 5 && flow && evaluation?.actionType === "call_ai" ? (
        <VerificationProofUpload
          flow={flow}
          resultId={evaluation.resultId}
          onSuccess={() => {
            setStep(6)
          }}
        />
      ) : null}

      {step === 6 && evaluation ? <VerificationConfirmation resultId={evaluation.resultId} /> : null}
    </div>
  )
}
