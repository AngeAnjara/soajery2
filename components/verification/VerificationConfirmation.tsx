"use client"

import * as React from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"

type Props = {
  resultId: string
}

export function VerificationConfirmation({ resultId }: Props) {
  const [downloading, setDownloading] = React.useState(false)

  const downloadReport = async () => {
    setDownloading(true)
    try {
      const res = await fetch(`/api/verification/report/${resultId}`)

      if (!res.ok) {
        const data = await res.json().catch(() => null)
        throw new Error(data?.error || "Impossible de télécharger le rapport")
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
    } catch (err: any) {
      toast.error(err?.message || "Erreur")
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="text-lg font-semibold">Vérification terminée</div>
      <p className="text-sm text-muted-foreground">
        Votre demande de vérification a été enregistrée. Si un paiement premium a été effectué, le rapport sera
        disponible après validation.
      </p>

      <Button type="button" onClick={downloadReport} disabled={downloading}>
        {downloading ? "Téléchargement..." : "Télécharger le rapport PDF"}
      </Button>
    </div>
  )
}
