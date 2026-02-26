"use client"

import * as React from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export function PaymentApprovalCard({
  payment,
  onRefresh,
}: {
  payment: any
  onRefresh: () => void
}) {
  const [loading, setLoading] = React.useState<"approve" | "reject" | null>(null)

  const act = async (type: "approve" | "reject") => {
    setLoading(type)
    try {
      const res = await fetch(`/api/admin/payments/${payment._id}/${type}`, { method: "POST" })
      const data = await res.json().catch(() => null)

      if (!res.ok) {
        throw new Error(data?.error || "Erreur")
      }

      toast.success(type === "approve" ? "Paiement approuvé" : "Paiement rejeté")
      onRefresh()
    } catch (e: any) {
      toast.error(e?.message || "Erreur")
    } finally {
      setLoading(null)
    }
  }

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-sm font-semibold">{payment?.userId?.name || "Utilisateur"}</div>
            <div className="text-xs text-muted-foreground">{payment?.userId?.email || ""}</div>
          </div>
          <Badge variant={payment.status === "pending" ? "outline" : "default"}>{payment.status}</Badge>
        </div>

        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <div className="text-xs text-muted-foreground">Montant</div>
            <div className="font-medium">{Number(payment.amount || 0).toLocaleString("fr-FR")} Ar</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">MVola</div>
            <div className="font-medium">{payment.mvolaPhone}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Ref</div>
            <div className="font-medium">{payment.transactionRef}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">last4UserId</div>
            <div className="font-medium">{payment.last4UserId}</div>
          </div>
        </div>

        {payment.proofImage ? (
          <div className="overflow-hidden rounded-md border bg-background">
            <img src={payment.proofImage} alt="proof" className="h-48 w-full object-contain" />
          </div>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button
            type="button"
            onClick={() => act("approve")}
            disabled={loading !== null || payment.status !== "pending"}
          >
            {loading === "approve" ? "..." : "Approuver"}
          </Button>
          <Button
            type="button"
            variant="outline"
            className="border-destructive/40 text-destructive hover:bg-destructive/10"
            onClick={() => act("reject")}
            disabled={loading !== null || payment.status !== "pending"}
          >
            {loading === "reject" ? "..." : "Rejeter"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
