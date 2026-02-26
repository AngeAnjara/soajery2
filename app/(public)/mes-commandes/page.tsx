"use client"

import * as React from "react"

import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type Payment = {
  _id: string
  relatedTo: "appointment" | "verification"
  relatedId: string
  amount: number
  status: "pending" | "approved" | "rejected"
  createdAt?: string
}

export default function MesCommandesPage() {
  const [loading, setLoading] = React.useState(true)
  const [payments, setPayments] = React.useState<Payment[]>([])

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/manual-payments/history?limit=50", { cache: "no-store" })
      const data = await res.json().catch(() => null)
      if (!res.ok) throw new Error(data?.error || "Erreur")

      const items = (data?.payments || []).filter((p: any) => p?.relatedTo === "verification")
      setPayments(items)
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    load()
  }, [])

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold">Mes commandes</h1>
        <p className="text-sm text-muted-foreground">Historique des commandes liées à la vérification.</p>
      </div>

      {loading ? <div className="text-sm text-muted-foreground">Chargement...</div> : null}

      {!loading && payments.length === 0 ? (
        <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          Aucune commande de vérification.
        </div>
      ) : null}

      <div className="space-y-3">
        {payments.map((p) => (
          <div key={p._id} className="flex flex-col gap-3 rounded-md border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-medium">Commande vérification</div>
              <div className="text-xs text-muted-foreground">
                Montant: {Number(p.amount || 0).toLocaleString("fr-FR")} Ar • Statut: {p.status}
                {p.createdAt ? ` • ${new Date(p.createdAt).toLocaleString()}` : ""}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/verification/report/${p.relatedId}`)
                    if (!res.ok) {
                      const data = await res.json().catch(() => null)
                      throw new Error(data?.error || "Rapport indisponible")
                    }
                    const blob = await res.blob()
                    const url = window.URL.createObjectURL(blob)
                    const a = document.createElement("a")
                    a.href = url
                    a.download = "rapport-verification.pdf"
                    document.body.appendChild(a)
                    a.click()
                    a.remove()
                    window.URL.revokeObjectURL(url)
                  } catch (e: any) {
                    toast.error(e?.message || "Erreur")
                  }
                }}
              >
                Télécharger le rapport
              </Button>
            </div>
          </div>
        ))}
      </div>
    </main>
  )
}
