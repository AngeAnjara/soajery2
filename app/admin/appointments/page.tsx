"use client"

import * as React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/admin/DataTable"

const statuses = [
  "all",
  "pending",
  "waiting_payment_verification",
  "paid",
  "cancelled",
] as const

export default function AdminAppointmentsPage() {
  const [status, setStatus] = React.useState<(typeof statuses)[number]>("all")
  const [appointments, setAppointments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = async (s: string) => {
    setLoading(true)
    try {
      const url = s === "all" ? "/api/admin/appointments" : `/api/admin/appointments?status=${encodeURIComponent(s)}`
      const res = await fetch(url)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur")
      setAppointments(data.appointments || [])
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load(status)
  }, [status])

  return (
    <div className="space-y-4">
      <div className="text-lg font-semibold">Rendez-vous</div>

      <Tabs.Root value={status} onValueChange={(v) => setStatus(v as any)}>
        <Tabs.List className="flex flex-wrap gap-2">
          {statuses.map((s) => (
            <Tabs.Trigger
              key={s}
              value={s}
              className="rounded-md border px-3 py-2 text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              {s}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
      </Tabs.Root>

      {loading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}

      <DataTable
        columns={[
          {
            key: "user",
            label: "User",
            render: (row) => row.userId?.email || row.userId?.name || "",
          },
          {
            key: "date",
            label: "Date",
            render: (row) => (row.date ? new Date(row.date).toLocaleString() : ""),
          },
          { key: "price", label: "Price" },
          {
            key: "status",
            label: "Status",
            render: (row) => <Badge variant="outline">{row.status}</Badge>,
          },
        ]}
        data={appointments}
        onEdit={async (row) => {
          try {
            const next = prompt("New status", row.status)
            if (!next) return
            const res = await fetch(`/api/admin/appointments/${row._id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ status: next }),
            })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success("Status updated")
            await load(status)
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
        onDelete={async (id) => {
          try {
            const res = await fetch(`/api/admin/appointments/${id}`, { method: "DELETE" })
            const data = await res.json().catch(() => null)
            if (!res.ok) throw new Error(data?.error || "Erreur")
            toast.success("Deleted")
            await load(status)
          } catch (e: any) {
            toast.error(e?.message || "Erreur")
          }
        }}
      />

      <p className="text-xs text-muted-foreground">
        Note: le bouton "Edit" ouvre un prompt pour changer le status.
      </p>
    </div>
  )
}
