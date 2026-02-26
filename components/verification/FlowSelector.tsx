"use client"

import * as React from "react"
import { toast } from "sonner"

import type { VerificationFlowDTO } from "@/types"

import { Button } from "@/components/ui/button"

type Props = {
  onSelect: (flow: VerificationFlowDTO) => void
}

export function FlowSelector({ onSelect }: Props) {
  const [flows, setFlows] = React.useState<VerificationFlowDTO[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true

    ;(async () => {
      try {
        const res = await fetch("/api/verification")
        const data = await res.json()

        if (!res.ok) {
          throw new Error(data?.error || "Erreur")
        }

        if (mounted) {
          setFlows(data.flows || [])
        }
      } catch (err: any) {
        toast.error(err?.message || "Erreur lors du chargement des flux")
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    })()

    return () => {
      mounted = false
    }
  }, [])

  if (loading) {
    return <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">Chargement...</div>
  }

  if (!flows.length) {
    return (
      <div className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">
        Aucun flux de vérification disponible pour le moment.
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Choisissez le type de vérification</div>
      <div className="grid gap-4 sm:grid-cols-2">
        {flows.map((flow) => (
          <button
            key={flow._id}
            type="button"
            onClick={() => onSelect(flow)}
            className="flex flex-col items-start rounded-xl border bg-card p-4 text-left transition hover:border-primary/60 hover:shadow-sm"
          >
            <div className="text-sm font-semibold sm:text-base">{flow.title}</div>
            {flow.description ? (
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground sm:text-sm">{flow.description}</p>
            ) : null}
            <div className="mt-2 text-xs font-medium text-primary sm:text-sm">
              Rapport détaillé: {flow.priceForDetailedReport.toLocaleString("fr-FR")} Ar
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
