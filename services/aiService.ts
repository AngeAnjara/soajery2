import type { FlowNode, UserAnswers } from "@/types/flow"

export function generatePrompt(answers: UserAnswers, nodes: FlowNode[]) {
  const questions = nodes.filter((n) => n.type === "question")

  const included = questions.filter((q) => {
    const md = q.data?.aiMetadata
    return !!md?.includeInPrompt
  })

  const answerQuestions = questions.filter((q) => {
    const key = q.data.fieldKey
    const v = answers[key]
    if (v === undefined || v === null) return false
    if (typeof v === "string") return v.trim().length > 0
    if (Array.isArray(v)) return v.length > 0
    return true
  })

  const tags = included
    .map((q) => {
      const tag = q.data?.aiMetadata?.tag
      const weight = q.data?.aiMetadata?.weight
      if (typeof tag !== "string" || tag.trim().length === 0) return null
      if (typeof weight === "number" && weight > 1) return `${tag.trim()} (poids: ${weight})`
      return tag.trim()
    })
    .filter((t): t is string => typeof t === "string" && t.trim().length > 0)

  const answerLines = answerQuestions.map((q) => {
    const key = q.data.fieldKey
    const label = q.data.label?.trim() ? q.data.label.trim() : q.data.fieldKey
    const value = answers[key]

    if (Array.isArray(value)) {
      return `- ${label}: ${value.join(", ")}`
    }

    if (typeof value === "boolean") {
      return `- ${label}: ${value ? "true" : "false"}`
    }

    if (typeof value === "number") {
      return `- ${label}: ${value}`
    }

    return `- ${label}: ${typeof value === "string" ? value : ""}`
  })

  if (!answerLines.length) {
    const fallback = Object.entries(answers || {})
      .filter(([, v]) => {
        if (v === undefined || v === null) return false
        if (typeof v === "string") return v.trim().length > 0
        if (Array.isArray(v)) return v.length > 0
        return true
      })
      .map(([k, v]) => {
        if (Array.isArray(v)) return `- ${k}: ${v.join(", ")}`
        return `- ${k}: ${typeof v === "string" ? v : typeof v === "boolean" ? String(v) : typeof v === "number" ? String(v) : ""}`
      })
    answerLines.push(...fallback)
  }

  const prompt = [
    "Tu es un assistant d'analyse de documents et de conformité.",
    "Tu vas analyser les données utilisateur ci-dessous et produire des sorties structurées.",
    "",
    "Données utilisateur:",
    answerLines.length ? answerLines.join("\n") : "- (aucune)",
    "",
    "Tags détectés:",
    tags.length ? tags.map((t) => `- ${t}`).join("\n") : "- (aucun)",
    "",
    "Sorties attendues (répondre exactement avec les 4 sections numérotées):",
    "1) Résumé: ...",
    "2) Analyse: ...",
    "3) Recommandation: ...",
    "4) Niveau de confiance: (Faible | Moyen | Élevé) + justification courte",
  ].join("\n")

  return prompt
}
