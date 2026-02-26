"use client"

import * as React from "react"
import { toast } from "sonner"

import type { AvailableSlotDTO } from "@/types"

import { Button } from "@/components/ui/button"

const phoneRegex = /^03[2-4]\d{7}$/

export function ProofUploadForm({
  userId,
  slot,
  onSuccess,
}: {
  userId: string
  slot: AvailableSlotDTO
  onSuccess: () => void
}) {
  const [mvolaPhone, setMvolaPhone] = React.useState("")
  const [transactionRef, setTransactionRef] = React.useState("")
  const [file, setFile] = React.useState<File | null>(null)
  const [loading, setLoading] = React.useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!phoneRegex.test(mvolaPhone)) {
      toast.error("Numéro MVola invalide")
      return
    }

    if (!transactionRef.trim()) {
      toast.error("Référence transaction requise")
      return
    }

    if (!file) {
      toast.error("Capture preuve requise")
      return
    }

    setLoading(true)

    try {
      const appointmentRes = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: slot._id,
          date: slot.date,
          price: slot.price,
        }),
      })

      const appointmentData = await appointmentRes.json()

      if (!appointmentRes.ok) {
        throw new Error(appointmentData?.error || "Erreur")
      }

      const appointmentId = appointmentData?.appointment?._id

      const form = new FormData()
      form.set("relatedTo", "appointment")
      form.set("relatedId", String(appointmentId))
      form.set("amount", String(slot.price))
      form.set("mvolaPhone", mvolaPhone)
      form.set("transactionRef", transactionRef)
      form.set("proofImage", file)

      const paymentRes = await fetch("/api/manual-payments", {
        method: "POST",
        body: form,
      })

      const paymentData = await paymentRes.json()
      if (!paymentRes.ok) {
        throw new Error(paymentData?.error || "Erreur")
      }

      toast.success("Preuve envoyée")
      onSuccess()
    } catch (err: any) {
      toast.error(err?.message || "Erreur")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-xl border bg-card p-6">
      <div className="text-lg font-semibold">Envoyer la preuve</div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Numéro MVola</label>
        <input
          value={mvolaPhone}
          onChange={(e) => setMvolaPhone(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          placeholder="0341234567"
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Référence transaction</label>
        <input
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          className="h-10 w-full rounded-md border bg-background px-3 text-sm"
          placeholder="REF..."
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Capture de preuve</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="block w-full text-sm"
        />
      </div>

      <Button type="submit" disabled={loading}>
        {loading ? "Envoi..." : "Envoyer"}
      </Button>
    </form>
  )
}
