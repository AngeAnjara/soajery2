import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { verifyTokenPayload } from "@/lib/jwt"

import { VerificationStepper } from "@/components/verification/VerificationStepper"

export default async function VerifierPapierPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/login?next=/verifier-papier")
  }

  const payload = verifyTokenPayload(token)

  return (
    <main className="mx-auto max-w-6xl space-y-8 px-4 py-12">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Vérification de dossier papier</h1>
        <p className="max-w-2xl text-sm text-muted-foreground sm:text-base">
          Répondez à quelques questions, puis obtenez un rapport de vérification de votre dossier. Si besoin,
          vous pourrez débloquer un rapport détaillé via paiement MVola.
        </p>
      </section>

      <VerificationStepper userId={payload.userId} />
    </main>
  )
}
