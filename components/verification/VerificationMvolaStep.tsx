"use client"

import * as React from "react"
import gsap from "gsap"

import type { VerificationFlowDTO } from "@/types"

import { Button } from "@/components/ui/button"

function formatTime(sec: number) {
  const m = Math.floor(sec / 60)
  const s = sec % 60
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
}

type Props = {
  flow: VerificationFlowDTO
  userId: string
  onNext: () => void
}

export function VerificationMvolaStep({ flow, userId, onNext }: Props) {
  const [remainingSeconds, setRemainingSeconds] = React.useState(900)
  const [expired, setExpired] = React.useState(false)

  const last4 = React.useMemo(() => userId.slice(-4), [userId])
  const merchantPhone = process.env.NEXT_PUBLIC_MVOLA_MERCHANT_PHONE || ""
  const ussdCode = React.useMemo(() => {
    return `*111*1*2*${merchantPhone}*${flow.priceForDetailedReport}*${last4}#`
  }, [merchantPhone, flow.priceForDetailedReport, last4])

  React.useEffect(() => {
    setExpired(false)
    setRemainingSeconds(900)

    const obj = { t: 900 }

    const tween = gsap.to(obj, {
      t: 0,
      duration: 900,
      ease: "none",
      onUpdate: () => {
        setRemainingSeconds(Math.max(0, Math.ceil(obj.t)))
      },
      onComplete: () => {
        setExpired(true)
      },
    })

    return () => {
      tween.kill()
    }
  }, [flow._id])

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="text-lg font-semibold">Paiement MVola</div>
      <p className="text-sm text-muted-foreground">
        Composez ce code USSD pour effectuer le paiement du rapport détaillé, puis passez à l'étape suivante.
      </p>

      <div className="rounded-lg border bg-background p-4">
        <code className="break-all text-sm">{ussdCode}</code>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Temps restant: <span className="font-medium text-foreground">{formatTime(remainingSeconds)}</span>
        </div>
        {expired ? <div className="text-sm font-medium text-destructive">Code expiré</div> : null}
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          variant="outline"
          onClick={async () => {
            await navigator.clipboard.writeText(ussdCode)
          }}
        >
          Copier
        </Button>

        <Button type="button" onClick={onNext} disabled={expired}>
          J'ai effectué le paiement
        </Button>
      </div>
    </div>
  )
}
