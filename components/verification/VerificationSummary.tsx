"use client"

import * as React from "react"

import type { FlowRunResultDTO, VerificationFlowDTO } from "@/types"

import { Button } from "@/components/ui/button"

type Props = {
  flow: VerificationFlowDTO
  result: FlowRunResultDTO
  onBack: () => void
  onRequestPremium: () => void
}

export function VerificationSummary({ flow, result, onBack, onRequestPremium }: Props) {
  const isDetailed = result.actionType === "call_ai"

  const isAlert = result.resultTitle === "Avertissement"

  const [aiLoading, setAiLoading] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [aiAnalysis, setAiAnalysis] = React.useState<any>(result.aiAnalysis || null)
  const aiRequestedRef = React.useRef(false)

  const generateAiSummary = async () => {
    try {
      setAiError(null)
      setAiLoading(true)

      const res = await fetch(`/api/verification/ai-summary/${result.resultId}`, { method: "POST" })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "Erreur")

      setAiAnalysis(data?.aiAnalysis || null)
    } catch (e: any) {
      setAiError(e?.message || "Erreur")
    } finally {
      setAiLoading(false)
    }
  }

  React.useEffect(() => {
    if (!isDetailed) return
    if (aiRequestedRef.current) return
    if (aiLoading) return
    if (aiAnalysis) return

    aiRequestedRef.current = true
    generateAiSummary()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDetailed, result.resultId])

  return (
    <div className="space-y-4 rounded-xl border bg-card p-6">
      <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
        <div>
          <div className="text-lg font-semibold">Résumé de la vérification</div>
          <p className="text-sm text-muted-foreground">Flux: {flow.title}</p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={onBack}>
          Modifier les réponses
        </Button>
      </div>

      {isDetailed ? (
        <div className="space-y-3 rounded-lg border bg-background p-4">
          <div>
            <div className="text-sm font-semibold">Résumé & analyse (IA)</div>
            <div className="text-xs text-muted-foreground">Génère un résumé complet et une analyse via Together AI (Llama).</div>
          </div>

          {aiError ? <div className="text-sm text-destructive">{aiError}</div> : null}

          {aiLoading ? <div className="text-sm text-muted-foreground">Génération...</div> : null}

          {aiAnalysis ? (
            <div className="space-y-3">
              {aiAnalysis.summary ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Résumé</div>
                  <div className="text-sm text-muted-foreground">{aiAnalysis.summary}</div>
                </div>
              ) : null}

              {aiAnalysis.analysis ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Analyse</div>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">{aiAnalysis.analysis}</div>
                </div>
              ) : null}

              {aiAnalysis.recommendation ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Recommandation</div>
                  <div className="whitespace-pre-wrap text-sm text-muted-foreground">{aiAnalysis.recommendation}</div>
                </div>
              ) : null}

              {aiAnalysis.confidence ? (
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">Niveau de confiance</div>
                  <div className="text-sm text-muted-foreground">{aiAnalysis.confidence}</div>
                </div>
              ) : null}
            </div>
          ) : aiLoading ? null : aiError ? null : (
            <div className="text-sm text-muted-foreground">Génération en cours...</div>
          )}
        </div>
      ) : null}

      <div className="space-y-2">
        <div className="text-sm font-medium">Résultat</div>
        <div className="space-y-1">
          <div className={isAlert ? "text-sm font-semibold text-red-700" : "text-sm text-muted-foreground"}>
            {result.resultTitle || "Résultat"}
          </div>
          {result.resultDescription ? (
            <div className={isAlert ? "whitespace-pre-wrap text-sm text-red-600" : "text-sm text-muted-foreground"}>
              {result.resultDescription}
            </div>
          ) : null}
        </div>
      </div>

      {isDetailed ? (
        <div className="space-y-3 rounded-lg border border-dashed bg-background p-4">
          <div className="text-sm font-semibold">Rapport détaillé (AI)</div>
          <p className="text-sm text-muted-foreground">
            Pour accéder au rapport détaillé, un paiement MVola est requis.
            Montant: {flow.priceForDetailedReport.toLocaleString("fr-FR")} Ar.
          </p>
          {result.prompt ? (
            <div className="space-y-1">
              <div className="text-xs font-medium text-muted-foreground">Prompt</div>
              <pre className="max-h-48 overflow-auto rounded-md border bg-background p-2 text-xs">{result.prompt}</pre>
            </div>
          ) : null}
          <Button type="button" onClick={onRequestPremium}>
            Procéder au paiement MVola
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Le rapport standard pourra être téléchargé gratuitement à l'étape suivante.
        </p>
      )}
    </div>
  )
}
