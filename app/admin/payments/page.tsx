"use client"

import * as React from "react"
import * as Tabs from "@radix-ui/react-tabs"
import { toast } from "sonner"

import { PaymentApprovalCard } from "@/components/admin/PaymentApprovalCard"

const statuses = ["pending", "approved", "rejected"] as const

type Status = (typeof statuses)[number]

export default function AdminPaymentsPage() {
  const [status, setStatus] = React.useState<Status>("pending")
  const [payments, setPayments] = React.useState<any[]>([])
  const [loading, setLoading] = React.useState(true)

  const load = async (s: Status) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/payments?status=${encodeURIComponent(s)}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur")
      setPayments(data.payments || [])
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
      <div className="text-lg font-semibold">Paiements</div>

      <Tabs.Root value={status} onValueChange={(v) => setStatus(v as Status)}>
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

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {payments.map((p) => (
          <PaymentApprovalCard key={p._id} payment={p} onRefresh={() => load(status)} />
        ))}
      </div>
    </div>
  )
}
