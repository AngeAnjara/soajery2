"use client"

import * as React from "react"

import type { AvailableSlotDTO } from "@/types"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

function formatDate(value: string) {
  const d = new Date(value)
  return new Intl.DateTimeFormat("fr-FR", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d)
}

export function DateSelector({ onSelect }: { onSelect: (slot: AvailableSlotDTO) => void }) {
  const [slots, setSlots] = React.useState<AvailableSlotDTO[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const run = React.useCallback(async () => {
    setLoading(true)
    setError(null)

    const res = await fetch("/api/appointments/available-slots", { cache: "no-store" })
    const data = await res.json().catch(() => null)

    if (!res.ok) {
      setSlots([])
      setError(data?.error || "Impossible de charger les créneaux. Veuillez réessayer.")
      setLoading(false)
      return
    }

    setSlots(
      ((data?.slots || []) as any[]).map((s: any) => ({
        _id: String(s._id),
        date: new Date(s.date).toISOString(),
        maxSlots: s.maxSlots,
        bookedSlots: s.bookedSlots,
        price: s.price,
        isActive: s.isActive,
      })),
    )
    setLoading(false)
  }, [])

  React.useEffect(() => {
    let alive = true

    async function safeRun() {
      try {
        await run()
        if (!alive) return
      } finally {
        if (!alive) return
      }
    }

    void safeRun()
    return () => {
      alive = false
    }
  }, [run])

  if (loading) {
    return <div className="text-sm text-muted-foreground">Chargement...</div>
  }

  if (error !== null) {
    return (
      <div className="space-y-3">
        <div className="text-sm text-destructive">{error}</div>
        <Button type="button" variant="outline" onClick={() => run()}>
          Actualiser
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-end">
        <Button type="button" variant="outline" onClick={() => run()}>
          Actualiser
        </Button>
      </div>

      {slots.length === 0 ? (
        <div className="text-sm text-muted-foreground">Aucun créneau disponible.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {slots.map((slot) => {
            const remaining = slot.maxSlots - slot.bookedSlots
            const disabled = remaining <= 0 || !slot.isActive

            return (
              <button
                key={slot._id}
                type="button"
                disabled={disabled}
                onClick={() => onSelect(slot)}
                className={cn("text-left", disabled && "cursor-not-allowed opacity-50")}
              >
                <Card className="transition-colors hover:bg-accent">
                  <CardHeader>
                    <CardTitle className="text-base">{formatDate(slot.date)}</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    <div>Prix: {slot.price} Ar</div>
                    <div>Places restantes: {remaining}</div>
                  </CardContent>
                </Card>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
