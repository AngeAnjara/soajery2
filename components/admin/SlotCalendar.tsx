"use client"

import * as React from "react"
import { toast } from "sonner"

import { CrudModal } from "@/components/admin/CrudModal"
import { Button } from "@/components/ui/button"

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

function pad2(n: number) {
  return String(n).padStart(2, "0")
}

function toDateOnlyLocal(d: Date) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`
}

function toDateOnlyFromUtcDate(dateStr: string) {
  const d = new Date(dateStr)
  return `${d.getUTCFullYear()}-${pad2(d.getUTCMonth() + 1)}-${pad2(d.getUTCDate())}`
}

export function SlotCalendar() {
  const [month, setMonth] = React.useState(() => new Date())
  const [slots, setSlots] = React.useState<any[]>([])
  const [open, setOpen] = React.useState(false)
  const [editingId, setEditingId] = React.useState<string | null>(null)
  const [form, setForm] = React.useState({ date: "", maxSlots: 1, price: 5000, isActive: true })

  const load = async () => {
    const res = await fetch("/api/admin/slots")
    const data = await res.json()
    if (!res.ok) throw new Error(data?.error || "Erreur")
    setSlots(data.slots || [])
  }

  React.useEffect(() => {
    load().catch((e) => toast.error(e?.message || "Erreur"))
  }, [])

  const days = React.useMemo(() => {
    const start = startOfMonth(month)
    const end = endOfMonth(month)
    const firstWeekday = (start.getDay() + 6) % 7

    const out: (Date | null)[] = []
    for (let i = 0; i < firstWeekday; i++) out.push(null)
    for (let d = 1; d <= end.getDate(); d++) out.push(new Date(month.getFullYear(), month.getMonth(), d))
    return out
  }, [month])

  const byDay = React.useMemo(() => {
    const map = new Map<string, any[]>()
    for (const s of slots) {
      const day = new Date(s.date)
      const key = `${day.getFullYear()}-${day.getMonth()}-${day.getDate()}`
      map.set(key, [...(map.get(key) || []), s])
    }
    return map
  }, [slots])

  const openCreate = (d: Date) => {
    setEditingId(null)
    setForm({ date: toDateOnlyLocal(d), maxSlots: 1, price: 5000, isActive: true })
    setOpen(true)
  }

  const openEdit = (slot: any) => {
    setEditingId(String(slot._id))
    setForm({
      date: toDateOnlyFromUtcDate(slot.date),
      maxSlots: Number(slot.maxSlots || 1),
      price: Number(slot.price || 0),
      isActive: typeof slot.isActive === "boolean" ? slot.isActive : true,
    })
    setOpen(true)
  }

  const removeSlot = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/slots/${id}`, { method: "DELETE" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur")
      toast.success("Slot supprimé")
      await load()
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-lg font-semibold">Calendrier des slots</div>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          >
            Mois -
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          >
            Mois +
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {["L", "M", "M", "J", "V", "S", "D"].map((d, idx) => (
          <div key={`${d}-${idx}`} className="text-center text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}

        {days.map((d, idx) => {
          if (!d) return <div key={idx} className="h-24 rounded-md border bg-muted/30" />

          const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
          const daySlots = byDay.get(key) || []

          return (
            <div
              key={idx}
              className="h-24 rounded-md border bg-card p-2 text-left hover:border-primary/50"
              onClick={() => {
                openCreate(d)
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault()
                  openCreate(d)
                }
              }}
            >
              <div className="text-xs font-semibold">{d.getDate()}</div>
              <div className="mt-1 space-y-1">
                {daySlots.slice(0, 2).map((s) => (
                  <div key={s._id} className="flex items-center justify-between gap-2 rounded border bg-background px-1 py-0.5">
                    <div className="text-[10px] text-muted-foreground">
                      {s.bookedSlots}/{s.maxSlots} • {s.price} Ar {s.isActive === false ? "• off" : ""}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          openEdit(s)
                        }}
                        className="h-6 px-2 text-[10px]"
                      >
                        Edit
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          removeSlot(String(s._id))
                        }}
                        className="h-6 bg-destructive px-2 text-[10px] text-destructive-foreground hover:bg-destructive/90"
                      >
                        Del
                      </Button>
                    </div>
                  </div>
                ))}
                {daySlots.length > 2 ? (
                  <div className="text-[10px] text-muted-foreground">+{daySlots.length - 2}</div>
                ) : null}
              </div>
            </div>
          )
        })}
      </div>

      <CrudModal
        title={editingId ? "Modifier un slot" : "Créer un slot"}
        open={open}
        onClose={() => setOpen(false)}
        onSubmit={async () => {
          try {
            const url = editingId ? `/api/admin/slots/${editingId}` : "/api/admin/slots"
            const method = editingId ? "PATCH" : "POST"

            const res = await fetch(url, {
              method,
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                date: form.date,
                maxSlots: Number(form.maxSlots),
                price: Number(form.price),
                isActive: !!form.isActive,
              }),
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success(editingId ? "Slot mis à jour" : "Slot créé")
            setOpen(false)
            await load()
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
      >
        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-sm font-medium">Date (YYYY-MM-DD)</label>
            <input
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
              className="h-10 w-full rounded-md border bg-background px-3 text-sm"
            />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <label className="text-sm font-medium">Max slots</label>
              <input
                type="number"
                value={form.maxSlots}
                onChange={(e) => setForm((p) => ({ ...p, maxSlots: Number(e.target.value) }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Prix</label>
              <input
                type="number"
                value={form.price}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                className="h-10 w-full rounded-md border bg-background px-3 text-sm"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="slot-active"
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
            />
            <label htmlFor="slot-active" className="text-sm font-medium">
              Actif
            </label>
          </div>
        </div>
      </CrudModal>
    </div>
  )
}
