"use client"

import * as React from "react"

import type { AvailableSlotDTO } from "@/types"

import { Badge } from "@/components/ui/badge"
import { DateSelector } from "@/components/rendez-vous/DateSelector"
import { MvolaPaymentStep } from "@/components/rendez-vous/MvolaPaymentStep"
import { ProofUploadForm } from "@/components/rendez-vous/ProofUploadForm"

export function AppointmentStepper({ userId }: { userId: string }) {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1)
  const [slot, setSlot] = React.useState<AvailableSlotDTO | null>(null)

  const steps = [
    { id: 1, label: "Date" },
    { id: 2, label: "MVola" },
    { id: 3, label: "Preuve" },
    { id: 4, label: "Confirm" },
  ] as const

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {steps.map((s) => (
          <Badge key={s.id} variant={step === s.id ? "default" : "outline"}>
            {s.id}. {s.label}
          </Badge>
        ))}
      </div>

      {step === 1 ? (
        <DateSelector
          onSelect={(selected) => {
            setSlot(selected)
            setStep(2)
          }}
        />
      ) : null}

      {step === 2 && slot ? (
        <MvolaPaymentStep
          slot={slot}
          userId={userId}
          onNext={() => {
            setStep(3)
          }}
        />
      ) : null}

      {step === 3 && slot ? (
        <ProofUploadForm
          userId={userId}
          slot={slot}
          onSuccess={() => {
            setStep(4)
          }}
        />
      ) : null}

      {step === 4 ? (
        <div className="rounded-xl border bg-card p-6">
          <div className="text-lg font-semibold">Demande envoyée</div>
          <p className="mt-2 text-sm text-muted-foreground">
            Votre rendez-vous est en attente de vérification de paiement.
          </p>
        </div>
      ) : null}
    </div>
  )
}
